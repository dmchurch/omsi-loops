// prestige predictor from https://github.com/GustavJakobsson/IdleLoops-Predictor

/** @namespace `*/
const Koviko = {
  /**
   * IdleLoops view
   * @typedef {Object} Koviko__View
   * @prop {function} updateNextActions Method responsible for updating the view
   */

  /**
   * Represents an action in the action list
   * @typedef {Object} Koviko__ListedAction
   * @prop {string} name Name of the action
   * @prop {number} loops Number of loops to perform
   */

  /**
   * IdleLoops action
   * @typedef {Object} Koviko__Action
   * @prop {string} name Name of the action
   * @prop {number} expMult Experience multiplier (typically 1)
   * @prop {number} townNum The town to which the action belongs
   * @prop {string} varName The unique identifier used for variables in the `towns` array
   * @prop {number} [segments] Amount of segments per loop
   * @prop {number} [dungeonNum] The dungeon to which the action belongs
   * @prop {Object.<string, number>} stats Stats that affect and are affected by the action
   * @prop {Array.<string>} [loopStats] Stats used in the respective segment per loop
   * @prop {function} manaCost Mana cost to complete the action
   */

  /**
   * IdleLoops town, which includes total progression for all actions
   * @typedef {Object} Koviko__Town
   */

  /**
   * IdleLoops dungeon floor
   * @typedef {Object} Koviko__DungeonFloor
   * @prop {number} ssChance Chance to get a soulstone
   * @prop {number} completed Amount of times completed
   */

  /**
   * IdleLoops skill
   * @typedef {Object} Koviko__Skill
   * @prop {number} exp Experience
   */

  /** A prediction, capable of calculating and estimating ticks and rewards of an action. */
  Prediction: class {
    /**
     * Loop attributes for a prediction
     * @typedef {Object} Koviko_Prediction_Loop
     * @prop {function} cost Cost to complete a segment
     * @prop {function} tick Amount of progress completed in one tick
     * @prop {Object} effect Effects at the end of a loop or segment
     * @prop {function} [effect.segment] Effect at the end of a segment
     * @prop {function} [effect.loop] Effect at the end of a loop
     * @prop {function} [effect.end] Who knows
     * @prop {function} [max] idk
     */

    /**
     * Parameters to be passed to the Prediction constructor
     * @typedef {Object} Koviko_Prediction_Parameters
     * @prop {Array.<string>} affected Affected resources
     * @prop {function} [effect] Method that will mutate resources
     * @prop {Koviko_Prediction_Loop} [loop] Loop attributes
     * @prop {true|((resources: Koviko_Predictor_Resources) => boolean)} [canStart]
     * @prop {(resources: Koviko_Predictor_Resources, skills: Koviko_Predictor_Skills) => number} [manaCost]
     */

    /**
     * Create the prediction
     * @param {ActionName} name Name of the action
     * @param {Koviko_Prediction_Parameters} params Parameter object
     */
    constructor(name, params) {
      /**
       * Name of the action
       * @type {string}
       */
      this.name = name;

      /**
       * Action being estimated
       * @type {Mutable<AnyAction> & {segments?: number}}
       */
      this.action = translateClassNames(name);

      /**
       * The pre-calculated amount of ticks needed for the action to complete.
       * @type {number}
       */
      this._ticks = 0;

      /**
       * Resources affected by the action
       * @type {Array.<string>}
       */
      this.affected = params.affected || [];

      /**
       * Effect of the action.
       * @type {function|null}
       */
      this.effect = params.effect || null;

      /**
       * Effect(s) and tick calculations of the action's loops
       * @type {Koviko_Prediction_Loop|null}
       */
      this.loop = params.loop || null;

      /** @type {Koviko_Prediction_Parameters["canStart"]|true} */
      this.canStart = params.canStart || true;

      /** @type {Koviko_Prediction_Parameters["manaCost"]|false} */
      this.manaCost = params.manaCost || false;
    }

    /**
     * Calculate the number of ticks needed to complete the action.
     * @param {AnyAction} a Action object
     * @param {Koviko_Predictor_Stats} s Accumulated stat experience
     * @param {Koviko_Predictor_State} state 
     * @memberof Koviko.Prediction
     */
    updateTicks(a, s, state) {
      let baseMana=this.baseManaCost(a,state);
      let cost = statList.reduce((cost, i) => cost + (i in a.stats && i in s ? a.stats[i] / (1 + getLevelFromExp(s[i]) / 100) : 0), 0);
      this._baseManaCost=baseMana;
      return (this._ticks = Math.ceil(baseMana * cost - .000001));
    }

    /** 
     * returns the base mana cost of the action referenced, taking the context
     * @param {Koviko_Predictor_State|false} state 
     */
    baseManaCost(a,state=false) {
      if (this.manaCost) {
        if (state) {
          return this.manaCost(state.resources,state.skills);
        } else {
          return this._baseManaCost;
        }
      } else {
        return a.manaCost();
      }
    }

    /**
     * Get the pre-calculated amount of ticks needed for the action to complete.
     * @memberof Koviko.Prediction
     */
    ticks() {
      return this._ticks || 0;
    }

    /**
     * Add the experience gained in one tick to the accumulated stat experience.
     * @param {AnyAction} a Action object
     * @param {Koviko_Predictor_Stats} s Accumulated stat experience
     * @memberof Koviko.Prediction
     */
    exp(a, s, t, ss) {
      statList.forEach(i => {
        if (i in s) {
	   var expToAdd=0;
           const overFlow=prestigeBonus("PrestigeExpOverflow") - 1
           expToAdd=((a.stats[i]??0)+overFlow) * a.expMult * (this.baseManaCost(a) / this.ticks()) * this.getTotalBonusXP(i,t,ss);

          s[i] += expToAdd;
          let talentGain = expToAdd*(getSkillBonus("Wunderkind") + getBuffLevel("Aspirant") * 0.01) / 100;
          t[i] += talentGain;
        }
      });
    }

    getTotalBonusXP(statName,t,ss) {
      const soulstoneBonus = ss[statName] ? calcSoulstoneMult(ss[statName]) : 1;

        var statBonus=1
        if (["Dex","Str","Con","Spd","Per"].includes(statName)) {
            statBonus *= prestigeBonus("PrestigePhysical")
        }
        if (["Cha","Int","Luck","Soul"].includes(statName)) {
            statBonus *= prestigeBonus("PrestigeMental")
        }

      return statBonus * soulstoneBonus * (1 + Math.pow(getLevelFromTalent(t[statName]), 0.4) / 3);
    }

  },
 SacrificeSoulstones(amount,ss) {
    while (amount > 0)
    {
        let highestSoulstoneStat = "";
        let highestSoulstone = -1;
        for (const stat in stats) {
            if (ss[stat] > highestSoulstone) {
                highestSoulstoneStat = stat;
                highestSoulstone = ss[stat];
            }
        }
        //console.log("Subtracting " + Math.ceil(amount/9) + " soulstones from " + highestSoulstoneStat + ". Old total: " + stats[highestSoulstoneStat].soulstone + ". New Total: " + (stats[highestSoulstoneStat].soulstone - Math.ceil(amount/9)));
        ss[highestSoulstoneStat] -= Math.ceil(amount/9);
        amount -= Math.ceil(amount/9);
    }
},
  /** A collection of attributes and a comparison of those attributes from one snapshot to the next. */
  Snapshot: class {
    /**
     * Attributes to consider from one snapshot to the next.
     * @typedef {Object.<string, number>} Koviko_Snapshot_Attributes
     */

    /**
     * Comparison of current snapshot to last snapshot.
     * @typedef {Object} Koviko_Snapshot_Comparison
     * @prop {number} value New value after the snapshot is taken
     * @prop {number} delta Difference between new value and old value
     */

    /**
     * Create the snapshot handler.
     * @param {Koviko_Snapshot_Attributes} attributes Attributes and their values
     * @memberof Koviko.Snapshot
     */
    constructor(attributes) {
      /**
       * Valid attributes for a snapshot
       * @type {Object.<string, Koviko_Snapshot_Comparison>}
       */
      this.attributes = {};

      /**
       * Whether the attributes have been initialized
       * @type {boolean}
       */
      this._isInitialized = false;

      if (attributes) {
        this.init(attributes);
      }
    }

    /**
     * Initialize the attributes to consider in each snapshot.
     * @param {Koviko_Snapshot_Attributes} attributes Attributes and their values
     * @return {Object.<string, Koviko_Snapshot_Comparison>} Initial comparison values
     * @memberof Koviko.Snapshot
     */
    init(attributes) {
      for (let i in attributes) {
        this.attributes[i] = { value: attributes[i], delta: 0 };
      }

      this._isInitialized = true;

      return this.attributes;
    }

    /**
     * Take a snapshot of the attributes and compare them to the previous snapshot.
     * @param {Koviko_Snapshot_Attributes} attributes Attributes and their values
     * @return {Object.<string, Koviko_Snapshot_Comparison>} Comparison values from the last snapshot to the current one
     * @memberof Koviko.Snapshot
     */
    snap(attributes) {
      if (!this._isInitialized) {
        this.init(attributes);
      }

      for (let i in this.attributes) {
        this.attributes[i].delta = attributes[i] - (this.attributes[i].value || 0);
        this.attributes[i].value = attributes[i];
      }

      return this.attributes;
    }

    /**
     * Get the snapshot.
     * @return {Object.<string, Koviko_Snapshot_Comparison>} Comparison values from the last snapshot to the current one
     * @memberof Koviko.Snapshot
     */
    get() {
      return this.attributes;
    }
  },

  /** A cache so the predictor can skip expensivly calculating each action */

  Cache: 
  /**
   * @template {*} K type for keys
   * @template {*} R type for reset data
   * @template {*} T type for add data
   */
  class{
    constructor(){
      this.cache = [];
      this.index = 0;
    }
    /**
     * 
     * @param {K} key 
     * @returns {T|null}
     */
    next(key) {
      if(this.cache.length > (this.index + 1) && this.equals(this.cache[this.index + 1].key, key)){
        return structuredClone(this.cache[++this.index].data);
      } else{
        this.miss();
        return null;
      };
    }
    // Use current = true to invalidate the entry after reading it, current = false to invalidate the next entry
    miss(current = false) {
      this.cache = this.cache.slice(0, this.index + (current ? 0 : 1));
    }
    /** @param {R} data @returns {boolean} */
    reset(data) {
      this.index = 0;
      if(!this.equals(data, this.cache[0]?.data)){
        this.cache = [{key: '', data: structuredClone(data)}]
        return false;
      }
      return true;
    }
    /** @param {K} key @param {T} data */
    add(key, data) {
      this.cache.push({'key': key, 'data':structuredClone(data)})
    }
    // Why is this something i have to write
    equals(thing1, thing2) {
      return JSON.stringify(thing1) === JSON.stringify(thing2);
    }
  },

  /** A predictor which uses Predictions to calculate and estimate an entire action list. */
  Predictor: class {
    /**
     * Progression
     * @typedef {Object} Koviko_Predictor_Progression
     * @prop {number} completed The amount of total segments completed
     * @prop {number} progress The amount of progress in segments beyond that already represented in `completed`
     * @prop {number} total The amount of successful loops ever completed
     * @prop {number[]} [costList]
     * @prop {number} [loopTotalCost]
     */

    /**
     * Accumulated stat experience
     * @typedef {Object.<string, number>} Koviko_Predictor_Stats
     */

    /**
     * Accumulated skill experience
     * @typedef {Object.<string, number>} Koviko_Predictor_Skills
     */

    /**
     * Accumulated resources
     * @typedef {{guild: string, glasses?: boolean, pickaxe?: boolean, pegasus?: boolean, isManaDrought?: boolean} & Object.<string, number>} Koviko_Predictor_Resources
     */

    /**
     * Accumulated progress
     * @typedef {Object.<string, Koviko_Predictor_Progression>} Koviko_Predictor_Progress
     */

    /**
     * State object
     * @typedef {Object} Koviko_Predictor_State
     * @prop {Koviko_Predictor_Stats} stats Accumulated stat experience
     * @prop {Koviko_Predictor_Stats} talents Accumulated stat experience
     * @prop {Koviko_Predictor_Skills} skills Accumulated skill experience
     * @prop {Koviko_Predictor_Resources} resources Accumulated resources
     * @prop {Koviko_Predictor_Progress} progress Accumulated progress
     * @prop {Koviko_Snapshot|{}} [currProgress]
     * @prop {Koviko_Snapshot|{}} [toNextLoop]
     * @prop {any} soulstones
     */

    #nextUpdateId = 1;

    /** @type {Omit<Worker, 'postMessage'> & {postMessage(message: MessageToPredictor): void}} */
    #worker;
    /** @type {Record<number, {resolve: (data: MessageFromPredictor) => void, reject: (error: any) => void}>} */
    #channelAwaiters = {};
    /** @type {Record<number, MessageFromPredictor[]>} */
    #channelQueues = {};
    #workerDisabled = false;
    get worker() {
      if (this.isWorker) {
        throw new Error("Can't get worker from inside worker!");
      }
      if (!this.#worker && options.predictorBackgroundThread && !this.#workerDisabled) {
        this.#worker = new Worker("predictor-worker.js", {name: "predictor"});
        this.#worker.onmessage = this.handleWorkerMessage.bind(this);
        this.#worker.postMessage({type: "setOptions", options});
        this.#worker.postMessage({type: "verifyDefaultIds", idRefs: Data.exportDefaultIds()});
      }
      return this.#worker;
    }

    terminateWorker() {
      if (this.#worker) {
        this.#worker.terminate();
        this.#worker = null;
      }
    }

    /** @param {number} channel @returns {Promise<MessageFromPredictor>} */
    nextWorkerMessage(channel) {
      return new Promise((resolve, reject) => {
        const message = this.#channelQueues[channel]?.shift();
        if (message) {
          if (this.#channelQueues[channel].length === 0) {
            delete this.#channelQueues[channel];
          }
          resolve(message);
        } else {
          this.#channelAwaiters[channel]?.reject("channel overridden");
          this.#channelAwaiters[channel] = {resolve, reject};
        }
      });
    }

    /** @param {MessageEvent<MessageFromPredictor>} e  */
    handleWorkerMessage(e) {
      const {data} = e;
      if (data.type === "error") {
        // Errors are bad. Terminate and disable the worker.
        console.error(`Unrecoverable error in background predictor worker; disabling background predictor`, data);
        this.terminateWorker();
        this.#workerDisabled = true;
        inputElement("predictorBackgroundThreadInput").indeterminate = true;
        inputElement("predictorBackgroundThreadInput").disabled = true;
        return;
      } else if (data.type === "getSnapshots") {
        const {snapshotIds} = data;
        const requestedSnapshots = this.backgroundSnapshot
                                       .getHeritage()
                                       .filter(s => snapshotIds.includes(s.id))
                                       .sort((a, b) => snapshotIds.indexOf(a.id) - snapshotIds.indexOf(b.id));
        if (requestedSnapshots.length === snapshotIds.length) {
          const estimatedSize = requestedSnapshots.map(s => s.sizeEstimate).reduce((a, b) => a + b);
          // console.debug(`Exporting ${requestedSnapshots.length} snapshots of estimated size ${estimatedSize}.`, snapshotIds, requestedSnapshots);
          this.worker.postMessage({type: "importSnapshots", snapshotExports: requestedSnapshots.map(s => s.export())});
        } else {
          console.debug(`Only found ${requestedSnapshots.length} of ${snapshotIds.length} requested snapshots. Ignoring request, probably stale.`, snapshotIds, requestedSnapshots);
        }
        return;
      }
      const channel = data.id || 0;
      const awaiter = this.#channelAwaiters[channel];
      if (awaiter) {
        awaiter.resolve(data);
        delete this.#channelAwaiters[channel];
      } else {
        (this.#channelQueues[channel] ??= []).push(data);
      }
    }

    /**
     * Create the predictor
     */
    constructor(isWorker = false) {
      // Initialization steps broken into pieces, for my sake
      this.isWorker = isWorker;
      if (!isWorker) {
        this.initElements()
        this.setOptions(options);
      }
      this.initPredictions();
      this.state;
    }

    setOptions(options) {
      Koviko.options = options;
    }

    /**
     * Run a fake action list containing every possible action so that, hopefully, every function is ran at least once.
     * @memberof Koviko.Predictor
     */
    test() {
      /** @type {Partial<NextActionEntry>[]} */
      const actions = [];

      for (const name of typedKeys(this.predictions)) {
        actions.push({ name: name, loops: 100 });
      }

      this.update(actions, null, true);
    }

    /**
     * Build the element that shows the total mana required by the action list.
     * @memberof Koviko.Predictor
     */
    initElements() {
      // the HTML is in index.html and main.view.js now, we just need to bind event listeners

      /**
       * Element that displays the total amount of mana used in the action list
       * @type {HTMLElement}
       */
      this.totalDisplay = htmlElement("predictorTotalDisplay");
      this.statisticDisplay = htmlElement("predictorStatisticDisplay");

      Koviko.trackedStats = [
        {type:'R', name:'soul', display_name:'SS Equi %'},
        {type:'R', name:'soulNow', display_name:'SS Curr %'},
        {type:'R', name:'act', display_name:'Final Actions'},
        {type:'R', name:'survey', display_name:'Surveys', hidden:()=>(getExploreSkill()==0)},
        {type:'R', name:'invest', display_name:'Investment', hidden:()=>(goldInvested==0)},
        {type:'TIME', name:'tillKey', display_name:'Till Key', hidden:()=>(goldInvested==0)},
      ].reduce(
        (dict, el, index) => (dict[el.type + el.name] = el, dict),
        {}
      );
      for (const skill of skillList) {
        Koviko.trackedStats['S'+skill.toLowerCase()] = {type:'S', name:skill.toLowerCase(), display_name:skill, hidden:()=>(skills[skill].exp<=0)}
      }
      for (const stat of statList) {
        Koviko.trackedStats['T'+stat] = {type:'T', name:stat, display_name:_txt('stats>'+stat+'>long_form')}
      }
      for (const [key, stat] of Object.entries(Koviko.trackedStats)) {
        $('#predictorTrackedStatInput').append("<option value="+key+" hidden=''>("+stat.type+") "+stat.display_name+"</option>");
      }
      this.updateTrackedList();
    }

    updateTrackedList() {
      let statisticList = /** @type {JQuery<HTMLOptionElement>} */($("#predictorTrackedStatInput").children());
        for (const statistic of statisticList) {
          let trackedStat = Koviko.trackedStats[statistic.value];
          if(trackedStat && trackedStat.hidden) {
            statistic.hidden = trackedStat.hidden();
          } else {
            statistic.hidden = false;
          }
        }
        selectElement("predictorTrackedStatInput").value = options.predictorTrackedStat;
    }

    /**
     * Build all of the necessary components to make predictions about each action.
     * @memberof Koviko.Predictor
     */
    initPredictions() {
      /**
       * Helper methods
       * @type {Object.<string, function>}
       * @namespace
       */
      this.helpers = (this.helpers || {
        /**
         * Get the level of a town attribute.
         * @param {number} exp Amount of experience in the town attribute
         * @return {number} Current level of town attribute
         * @memberof Koviko.Predictor#helpers
         */
        getTownLevelFromExp: (exp) => Math.min(Math.floor((Math.sqrt(8 * exp / 100 + 1) - 1) / 2),100),

        /**
         * Get the current guild rank's bonus, noting that there is a max of 15 ranks, base zero.
         * @param {number} guild Guild level as number
         * @return {number} Current bonus from guild rank
         * @memberof Koviko.Predictor#helpers
         */
        getGuildRankBonus: (guild) => Math.floor(guild / 3 + .00001) >= 14 ? 10 :  precision3(1 + guild / 20 + (guild ** 2) / 300),

        /**
         * Calculate the bonus given by "Wizard College"
         * @param {Koviko_Predictor_Resources} r Accumulated resources
         * @return {number} Bonus Multiplier of the Wizard College
         * @memberof Koviko.Predictor#helpers
         */
        getWizardRankBonus: (r) => ((r.wizard >= 63) ? 5 : precision3(1 + 0.02 * Math.pow((r.wizard||0), 1.05))),

        getSkillBonusInc: (exp) => (Math.pow(1 +  getSkillLevelFromExp(exp) / 60, 0.25)),

        getSkillBonusDec: (exp) => (1 / (1 +  getSkillLevelFromExp(exp) / 100)),

        /**
         * Calculate the ArmorLevel specifically affecting the team leader
         * @param {Koviko_Predictor_Resources} r Accumulated resources
         * @param {Koviko_Predictor_Skills} k Accumulated skills
         * @return {number} Armor Multiplier for the Self Combat Calculation
         * @memberof Koviko.Predictor#helpers
         */
        getArmorLevel: (r, k) => (1 + (((r.armor||0) + 3 * (r.enchantments||0)) * (r.crafts?h.getGuildRankBonus(r.crafts):1) ) / 5),

        /**
         * Calculate the combat skill specifically affecting the team leader
         * @param {Koviko_Predictor_Resources} r Accumulated resources
         * @param {Koviko_Predictor_Skills} k Accumulated skills
         * @return {number} Combat skill of the team leader
         * @memberof Koviko.Predictor#helpers
         */
        getSelfCombat: (r, k) => ( getSkillLevelFromExp(k.combat) +  getSkillLevelFromExp(k.pyromancy) * 5) * h.getArmorLevel(r,k) * (1 + getBuffLevel("Feast") * 0.05) * prestigeBonus("PrestigeCombat"),

        getZombieStrength: (r, k) => (( getSkillLevelFromExp(k.dark) * (r.zombie||0) / 2 * Math.max(getBuffLevel("Ritual") / 100, 1)) * (1 + getBuffLevel("Feast") * 0.05)) * prestigeBonus("PrestigeCombat"),

        getTeamStrength: (r, k) => (( getSkillLevelFromExp(k.combat) +  getSkillLevelFromExp(k.restoration) * 4) * ((r.team||0) / 2) * (r.adventures?h.getGuildRankBonus(r.adventures):1) * h.getSkillBonusInc(k.leadership))  * (1 + getBuffLevel("Feast") * 0.05) * prestigeBonus("PrestigeCombat"),

        getTeamCombat: (r, k) => (h.getSelfCombat(r, k) + h.getZombieStrength(r, k) + h.getTeamStrength(r, k)),

        getRewardSS: (dNum) => Math.floor(Math.pow(10, dNum) * Math.pow(1 + getSkillLevel("Divine") / 60, 0.25)),

        getStatProgress: (p, a, s, offset) => (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]]) / 100),

        getTrialCost: (p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),

      });

      // Initialise cache

      /** @type {PredictorCache<[ActionName, number, boolean]|any, [PredictorRunState, string[]]|any, [PredictorRunState, number, boolean]|any>} */
      this.cache = new Koviko.Cache();
      if(typeof(structuredClone) !== 'function'){
        console.log('Predictor: This browser does not support structuredClone, disabling the cache');
        this.cache.reset = function(x) {return false;};
        this.cache.add = function(x, y) {};
      }

      // Alias the globals to a shorter variable name
      const g = Koviko.globals;
      const h = this.helpers;

      //assassin base
      const assassinBase={ affected: ['heart','rep'], loop: {
          max: () => 1,
          cost: (p) => segment => 50000000,
          tick: (p, a, s, k, r) => offset => {
            if ((p.completed / a.segments + .0000001)>=1) {
              return 0;
            }
            let baseSkill = Math.sqrt( getSkillLevelFromExp(k.practical)) +  getSkillLevelFromExp(k.thievery) +  getSkillLevelFromExp(k.assassin);
            let loopStat = (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]]) / 1000);
            let completions = Math.sqrt(1 + p.total / 100);
            let reputationPenalty = (Math.abs(r.rep)|| 1);
            let killStreak = (r.heart || 1);
            return baseSkill * loopStat * completions / reputationPenalty / killStreak;
          },
          effect: { loop: (r) => r.heart++, end: (r,k) => ( r.rep+=Math.min((r.town + 1) * -250 +  getSkillLevelFromExp(k.assassin), 0))},
        }};

      const surveyBase={affected:['map','completedMap'],canStart:(input)=>(input.map>0),effect:(r)=>(r.map--,r.completedMap++)};

      /**
       * Prediction parameters
       * @satisfies {Record<ActionName, Koviko_Prediction_Parameters>}
       */
      const predictions = {




        'RuinsZ1':{ affected:['']},
        'RuinsZ3':{ affected:['']},
        'RuinsZ5':{ affected:['']},
        'RuinsZ6':{ affected:['']},
        'HaulZ1':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[1] < 250),
          effect:(r) => {
          let t=towns[1]; //Area of the Action
          if (t.goodStonesZ1>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ1<=(t.checkedStonesZ1+(r.stoneCheckedZ1||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ1=(r.stoneCheckedZ1||0)+1;
          if (((t.checkedStonesZ1+r.stoneCheckedZ1)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ3':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[3] < 250),
          effect:(r) => {
          let t=towns[3]; //Area of the Action
          if (t.goodStonesZ3>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ3<=(t.checkedStonesZ3+(r.stoneCheckedZ3||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ3=(r.stoneCheckedZ3||0)+1;
          if (((t.checkedStonesZ3+r.stoneCheckedZ3)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ5':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[5] < 250),
          effect:(r) => {
          let t=towns[5]; //Area of the Action
          if (t.goodStonesZ5>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ5<=(t.checkedStonesZ5+(r.stoneCheckedZ5||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ5=(r.stoneCheckedZ5||0)+1;
          if (((t.checkedStonesZ5+r.stoneCheckedZ5)%1000)==0) {
            r.stone=1;
          }
        }},
        'HaulZ6':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)<1 && stonesUsed[6] < 250),
          effect:(r) => {
          let t=towns[6]; //Area of the Action
          if (t.goodStonesZ6>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ6<=(t.checkedStonesZ3+(r.stoneCheckedZ6||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ6=(r.stoneCheckedZ6||0)+1;
          if (((t.checkedStonesZ6+r.stoneCheckedZ6)%1000)==0) {
            r.stone=1;
          }
        }},
        'Map':{ affected:['gold','map'],
          canStart:(input)=>(input.gold>=15),
          effect:(r)=>(r.map++,r.gold-=15)},
        'Wander':{ affected:['']},
        'Smash Pots':{ affected:['mana'],
          effect:(r) => {
          r.temp1 = (r.temp1 || 0) + 1;
          r.mana += r.temp1 <= towns[0].goodPots ?  Action.SmashPots.goldCost() : 0;
        }},
        'Pick Locks':{ affected:['gold'],
          effect:(r) => {
          r.temp2 = (r.temp2 || 0) + 1;
          r.gold += r.temp2 <= towns[0].goodLocks ?  Action.PickLocks.goldCost() : 0;
        }},
        'Buy Glasses':{ affected:['gold','glassess'],
          canStart:(r)=>(r.gold>=10),
          effect:(r) => (r.gold -= 10, r.glasses = true)},
        'Found Glasses':{ affected:['']},
        'Buy Mana Z1':{ affected:['mana','gold','manaBought'],
          effect:(r) => {
          if (r.isManaDrought) {
            let spendGold = Math.min(r.gold, 300);
            let buyMana = Math.min(spendGold *  Action.BuyManaZ1.goldCost(), r.manaBought);
            r.mana+=buyMana;
            r.manaBought-=buyMana;
            r.gold-=spendGold;
          } else {
            r.mana += r.gold *  Action.BuyManaZ1.goldCost();
            r.gold = 0;
        }}},
        'Meet People':{ affected:['']},
        'Train Strength':{ affected:['']},
        'Short Quest':{ affected:['gold'],
          effect:(r) => {
          r.temp3 = (r.temp3 || 0) + 1;
          r.gold += r.temp3 <= towns[0].goodSQuests ?  Action.ShortQuest.goldCost() : 0;
        }},
        'Investigate':{ affected:['']},
        'Long Quest':{ affected:['gold','rep'],
          effect:(r) => {
          r.temp4 = (r.temp4 || 0) + 1;
          r.gold += r.temp4 <= towns[0].goodLQuests ?  Action.LongQuest.goldCost() : 0;
          r.rep += r.temp4 <= towns[0].goodLQuests ? 1 : 0;
        }},
        'Throw Party':{ affected:['rep'],
          canStart:(input)=>(input.rep>=2),
          effect:(r,k) => r.rep-=2},
        'Warrior Lessons':{ affected:[''],
          canStart:(input) => input.rep >= 2,
          effect:(r, k) => k.combat += 100*(1+getBuffLevel("Heroism") * 0.02)},
        'Mage Lessons':{ affected:[''],
          canStart:(input) => input.rep >= 2,
          effect:(r, k) => k.magic += 100 * (1 +  getSkillLevelFromExp(k.alchemy) / 100)},
        'Heal The Sick':{ affected:['rep'],
          canStart:(input) => (input.rep >= 1), loop: {
          cost:(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000,
          tick:(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 50, 1) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100),
          effect:{ end:(r, k) => k.magic += 10, loop:(r) => r.rep += 3}
        }},
        'Fight Monsters':{ affected:['gold'],
          canStart:(input) => (input.rep >= 2), loop: {
          cost:(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / a.segments + .0000001)) * 10000,
          tick:(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset),
          effect:{ end:(r, k) => k.combat += 10*(1+getBuffLevel("Heroism") * 0.02), segment:(r) => r.gold += 20}
        }},
        'Small Dungeon':{ affected:['soul'],
          canStart:(input) => input.rep >= 2, loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 15000),
          tick:(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ? (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r, k) => (k.combat += 5*(1+getBuffLevel("Heroism") * 0.02), k.magic += 5), loop:(r) => {
            let ssGained = h.getRewardSS(0);
            r.completionsSmallDungeon = (r.completionsSmallDungeon || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[0][r.completionsSmallDungeon - 1].ssChance;
          }}
        }},
        'Buy Supplies':{ affected:['gold'],
          canStart:(input) => input.gold >= 300 - Math.max((input.supplyDiscount || 0) * 20, 0),
          effect:(r) => (r.gold -= 300 - Math.max((r.supplyDiscount || 0) * 20, 0), r.supplies = (r.supplies || 0) + 1)},
        'Haggle':{ affected:['rep'],
          canStart:(input) => (input.rep > 0),
          effect:(r) => (r.rep--, r.supplyDiscount = (r.supplyDiscount >= 15 ? 15 : (r.supplyDiscount || 0) + 1))},
        'Start Journey':{ affected:[''],
          canStart:r => r.supplies >= 1,
          effect:(r) => (r.supplies = (r.supplies || 0) - 1, r.town =1)},
        'Hitch Ride':{ affected:[''],
          canStart:true,
          effect:(r,k) => ( r.town =2)},
        'Open Rift':{ affected:[''],
          effect:(r,k) => (r.supplies = 0, r.town =5, k.dark+=1000)},
        'Explore Forest':{ affected:['']},
        'Wild Mana':{ affected:['mana'],
          effect:(r) => {
          r.temp5 = (r.temp5 || 0) + 1;
          r.mana += r.temp5 <= towns[1].goodWildMana ?  Action.WildMana.goldCost() : 0;
        }},
        'Gather Herbs':{ affected:['herbs'],
          effect:(r) => {
          r.temp6 = (r.temp6 || 0) + 1;
          r.herbs += r.temp6 <= towns[1].goodHerbs ? 1 : 0;
        }},
        'Hunt':{ affected:['hide'],
          effect:(r) => {
          r.temp7 = (r.temp7 || 0) + 1;
          r.hide += r.temp7 <= towns[1].goodHunt ? 1 : 0;
        }},
        'Sit By Waterfall':{ affected:['']},
        'Old Shortcut':{ affected:['']},
        'Talk To Hermit':{ affected:['']},
        'Practical Magic':{ affected:[''],
          effect:(r, k) => k.practical += 100},
        'Learn Alchemy':{ affected:['herbs'],
          canStart:(input) => (input.herbs >= 10),
          effect:(r, k) => (r.herbs -= 10, k.alchemy += 50, k.magic += 50)},
        'Brew Potions':{ affected:['herbs','potions'],
          canStart:(input) => (input.herbs >= 10 && input.rep >= 5),
          effect:(r, k) => (r.herbs -= 10, r.potions++, k.alchemy += 25, k.magic += 50)},
        'Train Dexterity':{ affected:['']},
        'Train Speed':{ affected:['']},
        'Follow Flowers':{ affected:['']},
        'Bird Watching':{ affected:[''],
          canStart:(input) => !!input.glasses},
        'Clear Thicket':{ affected:['']},
        'Talk To Witch':{ affected:['']},
        'Dark Magic':{ affected:['rep'],
          canStart:(input) => (input.rep <= 0),
          effect:(r, k) => (r.rep--, k.dark += Math.floor(100 * (1 + buffs.Ritual.amt / 100)))},
        'Dark Ritual':{ affected:['ritual','soul'],
          canStart:(input) => (input.rep <= -5), loop: {
          max:() => 1,
          cost:(p) => segment => 1000000 * (segment * 2 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.dark) * h.getStatProgress(p, a, s, offset)) / (1 - towns[1].getLevel("Witch") * .005) : 0;
          },
          effect:{loop:(r,k,ss) => {
            r.ritual++;
            let ssCost = Action.DarkRitual.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;

            var amount=ssCost
            //SacrificeSoulstones(ssCost,ss)


            while (amount > 0)
    {
        let highestSoulstoneStat = "";
        let highestSoulstone = -1;
        for (const stat in stats) {
            if (ss[stat] > highestSoulstone) {
                highestSoulstoneStat = stat;
                highestSoulstone = ss[stat];
            }
        }
        //console.log("Subtracting " + Math.ceil(amount/9) + " soulstones from " + highestSoulstoneStat + ". Old total: " + stats[highestSoulstoneStat].soulstone + ". New Total: " + (stats[highestSoulstoneStat].soulstone - Math.ceil(amount/9)));
        ss[highestSoulstoneStat] -= Math.ceil(amount/9);
        amount -= Math.ceil(amount/9);
    }




          }}
        }},
        'Continue On':{ affected:[''],
          effect:(r) => r.town = 2},
        'Explore City':{ affected:['']},
        'Gamble':{ affected:['gold','rep'],
          canStart:(input) => (input.rep >= -5 && input.gold >= 20),
          effect:(r) => {
          r.temp8 = (r.temp8 || 0) + 1;
          r.gold += (r.temp8 <= towns[2].goodGamble ? Math.floor(60 * Math.pow(1 + getSkillLevel("Thievery") / 60, 0.25)) : 0)-20;
          r.rep--;
        }},
        'Get Drunk':{ affected:['rep'],
          canStart:(input) => (input.rep >= -3),
          effect:(r) => r.rep--},
        'Buy Mana Z3':{ affected:['mana','gold'],
          canStart:true,
          effect:(r) => (r.mana += r.gold *  Action.BuyManaZ3.goldCost(), r.gold = 0)},
        'Sell Potions':{ affected:['gold','potions'],
          effect:(r, k) => (r.gold += r.potions *  getSkillLevelFromExp(k.alchemy), r.potions = 0)},
        'Adventure Guild':{ affected:['gold','adventures'],
          canStart:(input) => (input.guild==''), loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e6,
          tick:(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic) / 2) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r) => (r.guild='adventure'), segment:(r) => (r.mana += 200, r.adventures++)}
        }},
        'Gather Team':{ affected:['team','gold'],
          canStart:(input) => ((input.guild=='adventure')&&(input.gold>=(input.team+1) * 100)),
          effect:(r) => (r.team = (r.team || 0) + 1, r.gold -= r.team * 100)},
        'Large Dungeon':{ affected:['team','soul'],
          canStart:(input) => (input.team>0), loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(3, Math.floor((p.completed + segment) / a.segments + .0000001)) * 5e5),
          tick:(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in  dungeons[a.dungeonNum] ? (h.getTeamCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r, k) => (k.combat += 15*(1+getBuffLevel("Heroism") * 0.02), k.magic += 15), loop:(r) => {
            let ssGained = h.getRewardSS(1);
            r.completionsLargeDungeon = (r.completionsLargeDungeon || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[1][r.completionsLargeDungeon - 1].ssChance;
          }}
        }},
        'Crafting Guild':{ affected:['gold','crafts'],
          canStart:(input) => (input.guild==''), loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 2e6,
          tick:(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) / 2 +  getSkillLevelFromExp(k.crafting)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r) => (r.guild='crafting'), segment:(r, k) => (r.gold += 10, r.crafts++, k.crafting += 50)}
        }},
        'Craft Armor':{ affected:['hide'],
          canStart:(input) => (input.hide >= 2),
          effect:(r) => (r.hide -= 2, r.armor = (r.armor || 0) + 1)},
        'Apprentice':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => Math.min((r.apprentice = (r.apprentice || towns[2].expApprentice) + 30 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 10 * (1 + h.getTownLevelFromExp(r.apprentice) / 100))},
        'Mason':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => (r.mason = Math.min((r.mason || towns[2].expMason) + 20 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 20 * (1 + h.getTownLevelFromExp(r.mason) / 100))},
        'Architect':{ affected:[''],
          canStart:(input) => (input.guild=='crafting'),
          effect:(r, k) => Math.min((r.architect = (r.architect || towns[2].expArchitect) + 10 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 40 * (1 + h.getTownLevelFromExp(r.architect) / 100))},
        'Read Books':{ affected:[''],
          canStart:(input) => input.glasses},
        'Buy Pickaxe':{ affected:['gold'],
          canStart:(input) =>(input.gold>=200),
          effect:(r) => (r.gold -= 200, r.pickaxe = true)},
        'Heroes Trial':{ affected:['heroism'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=100*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=100*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => (r.heroism=(r.heroism||0)+1)}
        }},
        'Start Trek':{ affected:[''],
          effect:(r) => r.town = 3},
        'Underworld':{ affected:['gold'],
          canStart:(input)=>(input.gold>=500),
          effect:(r) => (r.town = 7,r.gold-=500)},
        'Climb Mountain':{ affected:['']},
        'Mana Geyser':{ affected:['mana'],
          canStart:(input) => input.pickaxe,
          effect:(r) => {
          r.temp9 = (r.temp9 || 0) + 1;
          r.mana += r.temp9 <= towns[3].goodGeysers ? 5000 : 0;
        }},
        'Decipher Runes':{ affected:['']},
        'Chronomancy':{ affected:[''],
          effect:(r, k) => k.chronomancy += 100},
        'Looping Potion':{ affected:['herbs','lpotions'],
          canStart:(input) => (input.herbs>=400),
          effect:(r, k) => (r.herbs -= 400, r.lpotions=1, k.alchemy += 100)},
        'Pyromancy':{ affected:[''],
          effect:(r, k) => k.pyromancy += 100*(1+getBuffLevel("Heroism") * 0.02)},
        'Explore Cavern':{ affected:['']},
        'Mine Soulstones':{ affected:['soul'],
          canStart:(input) => input.pickaxe,
          effect:(r) => {
          r.temp10 = (r.temp10 || 0) + 1;
          let ssGained = r.temp10 <= towns[3].goodMineSoulstones ? h.getRewardSS(0) : 0;
          r.nonDungeonSS += ssGained;
          r.soul += ssGained;
        }},
        'Hunt Trolls':{ affected:['blood'], loop: {
          cost:(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments+.0000001)) * 1e6),
          tick:(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) * Math.sqrt(1 + p.total/100) * (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]])/100)),
          effect:{loop:(r, k) => (r.blood++, k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02))}
        }},
        'Check Walls':{ affected:['']},
        'Take Artifacts':{ affected:['artifacts'],
          effect:(r) => {
          r.temp11 = (r.temp11 || 0) + 1;
          r.artifacts += r.temp11 <= towns[3].goodArtifacts ? 1 : 0;
        }},
        'Imbue Mind':{ affected:['mind','soul'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          },
          effect:{loop:(r,k,ss) => {
            r.mind++;
            let ssCost = Action.ImbueMind.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;

                        var amount=ssCost
            //SacrificeSoulstones(ssCost,ss)


            while (amount > 0)
    {
        let highestSoulstoneStat = "";
        let highestSoulstone = -1;
        for (const stat in stats) {
            if (ss[stat] > highestSoulstone) {
                highestSoulstoneStat = stat;
                highestSoulstone = ss[stat];
            }
        }
        //console.log("Subtracting " + Math.ceil(amount/9) + " soulstones from " + highestSoulstoneStat + ". Old total: " + stats[highestSoulstoneStat].soulstone + ". New Total: " + (stats[highestSoulstoneStat].soulstone - Math.ceil(amount/9)));
        ss[highestSoulstoneStat] -= Math.ceil(amount/9);
        amount -= Math.ceil(amount/9);
    }


          }}
        }},
        'Imbue Body':{ affected:['body'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          },
          effect:{loop:(r,k,ss,t) => {
          r.body++

            for (const stat in stats) {
            t[stat] = getExpOfLevel(getLevelFromExp(t[stat]) - getBuffLevel("Imbuement2") - 1);
        }
          }}
        }},
        'Face Judgement':{ affected:[''],
          effect:(r) =>(r.town = r.rep>=50?4:(r.rep<=-50?5:3))},
        'Guru':{ affected:['herbs'],
          canStart:(input)=>(input.herbs>=1000),
          effect:(r) => (r.town = 4,r.herbs-=1000)},
        'Guided Tour':{ affected:['gold'],
          canStart:(input) => {
          return (input.gold >= 10);
        },
          effect:(r,k)=>(r.gold -= 10)},
        'Canvass':{ affected:['']},
        'Donate':{ affected:['gold','rep'],
          canStart:(input) => {
          return (input.gold >= 20);
        },
          effect:(r) => {
          r.gold -= 20;
          r.rep += 1;
        }},
        'Accept Donations':{ affected:['gold','rep'],
          canStart:(input) => {
          return (input.rep > 0);
        },
          effect:(r) => {
          r.donateLoot = (r.donateLoot || 0) + 1;
          if (r.donateLoot<=towns[4].goodDonations) {
            r.gold += 20;
          }
          r.rep -= 1;
        }},
        'Tidy Up':{ affected:['gold','rep'], loop: {
          cost:(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / 3 + .0000001)) * 1000000,
          tick:(p, a, s, k) => offset =>  getSkillLevelFromExp(k.practical) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100),
          effect:{loop:(r) => {
              r.gold += 5;
              r.rep += 1;
            }}
        }},
        'Buy Mana Z5':{ affected:['mana','gold'],
          canStart:true,
          effect:(r) => (r.mana += r.gold *  Action.BuyManaZ5.goldCost(), r.gold = 0)},
        'Sell Artifact':{ affected:['gold','artifacts'],
          canStart:(input) => {
          return (input.artifacts >= 1);
        },
          effect:(r) => {
          r.gold += 50;
          r.artifacts -= 1;
        }},
        'Gift Artifact':{ affected:['artifacts'],
          canStart:(input) => {
          return (input.artifacts >= 1);
        },
          effect:(r) => {
          r.artifacts -= 1;
          r.favor += 1;
        }},
        'Mercantilism':{ affected:[''],
          canStart:(input) => (input.rep > 0),
          effect:(r, k) => {
          k.mercantilism += 100;
          r.rep--;
        }},
        'Charm School':{ affected:['']},
        'Oracle':{ affected:['']},
        'Enchant Armor':{ affected:['armor','favor','enchantments'],
          canStart:(input) => {
          return (input.armor >  0 && input.favor >  0);
        },
          effect:(r) => {
          r.armor -= 1;
          r.favor -= 1;
          r.enchantments += 1;
        }},
        'Wizard College':{ affected:['gold','favor','wizard'],
          canStart:(input) => {
          return (input.gold >= 500 && input.favor >= 10);
        }, loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e7,
          tick:(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) +  getSkillLevelFromExp(k.practical) +  getSkillLevelFromExp(k.dark) +
                                           getSkillLevelFromExp(k.chronomancy) +  getSkillLevelFromExp(k.pyromancy) +  getSkillLevelFromExp(k.restoration) +  getSkillLevelFromExp(k.spatiomancy)) *
                                          h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r) => {r.gold -= 500; r.favor -=10;}, segment:(r, k) => (r.wizard++)}
        }},
        'Restoration':{ affected:[''], manaCost:(r,k)=>(15000 / h.getWizardRankBonus(r)),
          effect:(r, k) => k.restoration += 100*(1+getBuffLevel("Heroism") * 0.02)},
        'Spatiomancy':{ affected:[''], manaCost:(r,k)=>(20000 / h.getWizardRankBonus(r)),
          effect:(r, k) => k.spatiomancy += 100},
        'Seek Citizenship':{ affected:['']},
        'Build Housing':{ affected:[''],
          canStart:(input) => {
          return ((input.guild=='crafting') && ((input.houses||0) < Math.floor(h.getGuildRankBonus(input.crafts || 0) * (1 + Math.min( getSkillLevelFromExp(skills.Spatiomancy.exp),500) * .01))));
        },
          effect:(r) => (r.houses = (r.houses ? r.houses+1 : 1))},
        'Collect Taxes':{ affected:[''],
          canStart:(input) => (input.houses > 0),
          effect:(r, k) => {
          r.gold += Math.floor(r.houses *  getSkillLevelFromExp(k.mercantilism) / 10);
        }},
        'Pegasus':{ affected:['gold','favor'],
          canStart:(input) => {
          return (input.gold >= 200 && input.favor >= 20);
        },
          effect:(r) => {
          r.gold -= 200;
          r.favor -= 20;
          r.pegasus = true;
        }},
        'Great Feast':{ affected:['feast','soul'],
          canStart:(input) => (input.rep >= 100), loop: {
          max:() => 1,
          cost:(p) => segment => 1000000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            return  getSkillLevelFromExp(k.practical) * h.getStatProgress(p, a, s, offset);
          },
          effect:{loop:(r,k,ss) => {
            r.feast++;
            let ssCost = Action.GreatFeast.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;

                        var amount=ssCost
            //SacrificeSoulstones(ssCost,ss)


            while (amount > 0)
    {
        let highestSoulstoneStat = "";
        let highestSoulstone = -1;
        for (const stat in stats) {
            if (ss[stat] > highestSoulstone) {
                highestSoulstoneStat = stat;
                highestSoulstone = ss[stat];
            }
        }
        //console.log("Subtracting " + Math.ceil(amount/9) + " soulstones from " + highestSoulstoneStat + ". Old total: " + stats[highestSoulstoneStat].soulstone + ". New Total: " + (stats[highestSoulstoneStat].soulstone - Math.ceil(amount/9)));
        ss[highestSoulstoneStat] -= Math.ceil(amount/9);
        amount -= Math.ceil(amount/9);
    }


          }}
        }},
        'Fight Frost Giants':{ affected:['giants'],
          canStart:(input) => (input.pegasus), loop: {
          cost:(p, a) => segment => precision3(Math.pow(1.3, (p.completed + a.segments)) * 1e7),
          tick:(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset),
          effect:{segment:(r) => r.giants= (r.giants||0)+1, loop:(r,k) => {(k.combat += 1500*(1+getBuffLevel("Heroism") * 0.02))}}
        }},
        'Seek Blessing':{ affected:['giants'],
          canStart:(input) => {
          return (input.pegasus);
        },
          effect:(r, k) => {
          k.divine+= (r.giants>62? 10: precision3(1 + 0.05 * Math.pow(r.giants||0, 1.05)) ) *50;
          r.giants=0;
        }},
        'Fall From Grace':{ affected:[''],
          effect:(r) => {
          if (r.rep >= 0) {
            r.rep = -1;
          }
          r.town=5;
        }},
        'Meander':{ affected:['']},
        'Mana Well':{ affected:[''],
          canStart:true,
          effect:(r,k)=> {
            r.wellLoot = (r.wellLoot || 0) + 1;
            r.mana += r.wellLoot <= towns[5].goodWells ? Math.max(5000 - Math.floor(r.totalTicks/5),0) : 0;
          }},
        'Destroy Pylons':{ affected:['pylons'],
          effect:(r) => {
          r.pylonLoot = (r.pylonLoot || 0) + 1;
          if (r.pylonLoot<=towns[5].goodPylons) {
            r.pylons += 1;
          }
        }},
        'Raise Zombie':{ affected:['blood','zombie'],
          canStart:(input) => (input.blood >= 1),
          effect:(r) => {
            r.blood -= 1;
            r.zombie += 1;
          }},
        'Dark Sacrifice':{ affected:['blood'],
          canStart:(input) => (input.blood >= 1),
          effect:(r,k) => (r.blood -=1,k.commune+=100)},
        'The Spire':{ affected:['soul'],
          canStart:true, loop: {
          max:(a) =>  dungeons[a.dungeonNum].length,
          cost:(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000000),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ?
                h.getTeamCombat(r, k) *
                (1 + 0.1 * (r.pylons||0)) *
                h.getStatProgress(p, a, s, offset) *
                Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => {(k.combat += 100*(1+getBuffLevel("Heroism") * 0.02))}, loop:(r) => {
            let ssGained = h.getRewardSS(2);
            r.completionsTheSpire = (r.completionsTheSpire || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[2][r.completionsTheSpire - 1].ssChance;
          }}
        }},
        'Purchase Supplies':{ affected:['gold'],
          canStart:(input) => (input.gold >= 500 && !input.supplies),
          effect:(r) => {
          r.gold -= 500;
          r.supplies = (r.supplies || 0) + 1;
        }},
        'Dead Trial':{ affected:['zombie'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getZombieStrength(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{loop:(r) => (r.zombie++)}
        }},
        'Journey Forth':{ affected:[''],
          canStart:(input) => (input.supplies >= 1),
          effect:(r) => {
            r.supplies--;
            r.town=6;
        }},
        'Explore Jungle':{ affected:['herbs'],
          effect:(r) => (r.herbs++)},
        'Fight Jungle Monsters':{ affected:['blood'],
          canStart:true, loop: {
          cost:(p, a) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e8,
          tick:(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset) *
                                             Math.sqrt(1 + p.total / 1000),
          effect:{segment:(r) => r.blood=(r.blood||0)+1, loop:(r,k)=> (k.combat+=2000*(1+getBuffLevel("Heroism") * 0.02))}
        }},
        'Rescue Survivors':{ affected:[''],
          canStart:true, loop: {
          cost:(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000,
          tick:(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 100, 1) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100),
          effect:{ end:(r,k) => { (k.restoration += 25*(1+getBuffLevel("Heroism") * 0.02))}, segment:(r,k) => (r.survivor= (r.survivor||0)+1), loop:(r) => (r.rep+=4)}
        }},
        'Prepare Buffet':{ affected:['herbs','blood'],
          canStart:(input) => ((input.herbs>=10) && (input.blood>=1)),
          effect:(r,k) => {
            r.herbs-=10;
            r.blood--;
            k.gluttony+=5*r.survivor;
          }},
        'Totem':{ affected:['lpotions'],
          canStart:(input)=>(input.lpotions>0),
          effect:(r,k)=>(r.lpotions--,k.wunderkind+=100)},
        'Escape':{ affected:[''],
          canStart:(input) => (input.totalTicks<=50*60),
          effect:(r) => (r.town=7)},
        'Open Portal':{ affected:[''],
          effect:(r,k) => (r.town=1,k.restoration+=2500*(1+getBuffLevel("Heroism") * 0.02))},
        'Excursion':{ affected:['gold'],
          canStart:(input) => {
          return input.gold>=(((input.guild==='explorer')||(input.guild==='thieves')) ? 2 : 10);
        },
          effect:(r, k) => {
          r.gold -= (((r.guild==='explorer')||(r.guild==='thieves')) ? 2 : 10);
        }},
        'Explorers Guild':{ affected:['map','completedMap'],
          canStart:(input) => (input.guild==''),
          effect:(r,k) => {
          r.submittedMap=r.completedMap;
          r.completedMap=0;
          r.guild='explorer';
          if (r.map==0) {
            r.map=30;
          }
        }},
        'Thieves Guild':{ affected:['gold','thieves'],
          canStart:(input) => {
          return ((input.rep < 0) && (input.guild==''));
        }, loop: {
          cost:(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e8,
          tick:(p, a, s, k, r) => offset => ( getSkillLevelFromExp(k.practical) +  getSkillLevelFromExp(k.thievery)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000),
          effect:{ end:(r, k) => (r.guild='thieves',k.practical+=50,k.thievery+=50), segment:(r,k) => (r.gold += 10, r.thieves=( r.thieves||0)+1,k.practical+=50,k.thievery+=50)}
        }},
        'Pick Pockets':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(2 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=10 * (1 + towns[7].getLevel("PickPockets") / 100);
        }},
        'Rob Warehouse':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(20 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=20 * (1 + towns[7].getLevel("RobWarehouse") / 100);
        }},
        'Insurance Fraud':{ affected:[''],
          canStart:(input) => (input.guild==='thieves'),
          effect:(r, k) => {
          r.gold += Math.floor(Math.floor(200 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=40 * (1 + towns[7].getLevel("InsuranceFraud") / 100);
        }},
        'Guild Assassin':{ affected:['heart'],
          canStart:(input) => (input.guild==''),
          effect:(r,k) => {
          k.assassin+=100*Math.pow(r.heart,2);
          r.heart=0;
          r.guild='assassin';
        }},
        'Invest':{ affected:['gold'],
          canStart:(input)=>(input.gold>0),
          effect:(r,k)=> {
           k.mercantilism+=100;
           r.invested=r.gold;
           r.gold=0;
        }},
        'Collect Interest':{ affected:['gold'],
          canStart:true,
          effect:(r,k)=> {
           k.mercantilism+=50;
           r.gold+=Math.floor(goldInvested * .001);
        }},
        'Seminar':{ affected:['gold'],
          canStart:(input)=>(input.gold>=1000),
          effect:(r,k)=> {
           k.leadership+=200;
           r.gold-=1000;
        }},
        'Purchase Key':{ affected:['gold'],
          canStart:(input)=>(input.gold>=1000000),
          effect:(r,k)=> {
           r.gold-=1000000;
           r.key=1;
        }},
        'Secret Trial':{ affected:['zombie'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            if (!p.progress) p.teamCombat = h.getTeamCombat(r, k);
            return floor in trials[a.trialNum] ?  p.teamCombat * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{}
        }},
        'Leave City':{ affected:[''],
          canStart:(input)=>(input.key>0),
          effect:(r,k)=> {
           r.key=0;
           r.town=8;
        }},
        'Imbue Soul':{ affected:['body'],
          canStart:true, loop: {
          max:() => 1,
          cost:(p) => segment => 100000000 * (segment * 5 + 1),
          tick:(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          },
          effect:{loop:(r) => r.body++}
        }},
        'Build Tower':{ affected:['stone'],
          canStart:(input)=>((input.stone||0)==1),
          effect:(r,k)=>(r.stone=0)},
        'Gods Trial':{ affected:['power'],
          canStart:true, loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=250*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=50*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=50*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => {
            r.godFloor=(r.godFloor||0)+1;
            if (r.godFloor==99) {
              r.power=1;
            }
          }}
        }},
        'Challenge Gods':{ affected:['power'],
          canStart:(input)=>(input.power>0), loop: {
          max:(a) => trialFloors[a.trialNum],
          cost:(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin")),
          tick:(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          },
          effect:{ end:(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02)), loop:(r) => (r.power++)}
        }},
        'Restore Time':{ affected:['power','rep'],
          canStart:(input)=>(input.power>=8),
          effect:(r)=> (r.rep+=9999999)},


        //SPECIAL ACTIONS
        //Survey Actions
        'SurveyZ0': surveyBase,
        'SurveyZ1': surveyBase,
        'SurveyZ2': surveyBase,
        'SurveyZ3': surveyBase,
        'SurveyZ4': surveyBase,
        'SurveyZ5': surveyBase,
        'SurveyZ6': surveyBase,
        'SurveyZ7': surveyBase,
        'SurveyZ8': surveyBase,

        //assasin Actions;
        'AssassinZ0': assassinBase,
        'AssassinZ1': assassinBase,
        'AssassinZ2': assassinBase,
        'AssassinZ3': assassinBase,
        'AssassinZ4': assassinBase,
        'AssassinZ5': assassinBase,
        'AssassinZ6': assassinBase,
        'AssassinZ7': assassinBase,

      };

      /**
       * Prediction collection
       * @type {Partial<Record<ActionName, Koviko_Prediction & {_updateTicks?: any}>>}
       */
      this.predictions = {};

      // Create predictions
      for (const name of typedKeys(predictions)) {
        this.predictions[name] = new Koviko.Prediction(name, predictions[name]);
        if (name=="Secret Trial") {
          this.predictions["Secret Trial"]._updateTicks=this.predictions[name].updateTicks;
          this.predictions["Secret Trial"].updateTicks= (a, s, state) => {
            if (!state.currProgress["Secret Trial"]) {
              return this.predictions["Secret Trial"]._updateTicks(a, s, state);
            }
            return this.predictions["Secret Trial"]._ticks;
          }
        }
      }
    }

    /**
     * Fires before the main action list update, stores the current list to reduce flickering while updating.
     * @param {HTMLElement} [container] Parent element of the action list
     * @this {this & {update: {
     *  totalDisplay?: string,
     *  pre?: NodeListOf<Element>,
     * }}}
     */
    preUpdate(container) {
      this.update.totalDisplay = this.totalDisplay.innerHTML;
      this.updateTrackedList();
      const pre = container.querySelectorAll('ul.koviko');
      pre.forEach((element) => element.classList.add('expired'));
    }

    /**
     * Update the action list view.
     * @param {Partial<NextActionEntry>[]} actions Actions in the action list
     * @param {HTMLElement} [container] Parent element of the action list
     * @param {boolean} [isDebug] Whether to log useful debug information
     * @memberof Koviko.Predictor
     * @this {this & {update: {
     *  totalDisplay?: string,
     *  pre?: NodeListOf<Element>,
     *  id?: number,
     * }}}
     */
    async update(actions, container, isDebug) {

      performance.mark("start-predictor-update");
      this.updateHadNaNs = false;

      /**
       * Organize accumulated resources, accumulated stats, and accumulated progress into a single object
       * @type {Koviko_Predictor_State}
       */
      let state;

      //"Slowmode means only update the initial state every X Minutes
      if(options.predictorSlowMode) {
        if (this.initState && (new Date()<this.nextUpdate)) {
          state=structuredClone(this.initState);
          //console.log("Slowmode - Redraw");
        } else {
          this.nextUpdate=new Date(Date.now()+ options.predictorSlowTimer*1000*60);
          //console.log("Slowmode - Update Data");
        }
      }

      if (!state) {
        state = {
          // @ts-ignore
          resources: { mana: 250, town: /** @type {TownNum} */(0), guild: "", totalTicks: 0 },
          stats: statList.reduce((stats, name) => (stats[name] = getExpOfLevel(buffs.Imbuement2.amt*(skills.Wunderkind.exp>=100?2:1)), stats), {}),
          talents:  statList.reduce((talents, name) => (talents[name] = stats[name].talent, talents), {}),
          skills: Object.entries(skills).reduce((skills, x) => (skills[x[0].toLowerCase()] = x[1].exp, skills), {}),
          progress: {},
          currProgress: {},
          toNextLoop: {},
          soulstones: statList.reduce((soulstones, name) => (soulstones[name] = stats[name].soulstone, soulstones), {}),
        };
        if (options.predictorSlowMode) {
          this.initState=structuredClone(state);
        }
      }
      //Once you Surveyed everything you get free Glasses [Found Glasses]
      if(getExploreProgress() >= 100|| prestigeValues['completedAnyPrestige']) {
        state.resources.glasses=true;
      }

      //Challenge Mode
        if ((typeof challengeSave!="undefined")&&(challengeSave.challengeMode==1)) {
          state.resources.isManaDrought=true;
          state.resources.manaBought=7500;
        }


      /**
       * Snapshots of accumulated stats and accumulated skills
       * @type {Object}
       * @prop {Koviko_Snapshot} stats Snapshot of accumulated stats
       * @prop {Koviko_Snapshot} skills Snapshot of accumulated skills
       * @prop {Koviko_Snapshot} currProgress
       * @prop {Koviko_Snapshot} toNextLoop
       */
      const snapshots = {
        stats: new Koviko.Snapshot(state.stats),
        skills: new Koviko.Snapshot(state.skills),
        currProgress: new Koviko.Snapshot({"Fight Monsters": 0, "Heal The Sick": 0, "Small Dungeon": 0, "Large Dungeon": 0, "Hunt Trolls": 0, "Tidy Up":0,"Fight Frost Giants":0, "The Spire":0, "Fight Jungle Monsters":0,"Rescue Survivors":0,"Heroes Trial":0,
          "Dead Trial":0, "Secret Trial":0, "Gods Trial":0, "Challenge Gods":0}),
        toNextLoop: new Koviko.Snapshot({"Fight Monsters": 0, "Heal The Sick": 0, "Small Dungeon": 0, "Large Dungeon": 0, "Hunt Trolls": 0, "Tidy Up":0,"Fight Frost Giants":0, "The Spire":0, "Fight Jungle Monsters":0,"Rescue Survivors":0,"Heroes Trial":0,
          "Dead Trial":0, "Secret Trial":0, "Gods Trial":0, "Challenge Gods":0, "Dark Ritual":0, "Imbue Mind":0, "Imbue Body":0})
      };

      /**
       * Total mana used for the action list
       * @type {number}
       */
      let total = 0;


      /**
       * All affected resources of the current action list
       * @type {Array.<string>}
       */
      const affected = Object.keys(actions.reduce((stats, x) => (x.name in this.predictions && this.predictions[x.name].affected || []).reduce((stats, name) => (stats[name] = true, stats), stats), {}));

      // Reset the cache's index
      // returns false on cache miss
      let cacheIsValid = this.cache.reset([state, affected]);


      //Statistik parammeters
      let statisticStart=0;
      let newStatisticValue=0;
      const trackedStat = Koviko.trackedStats[options.predictorTrackedStat];
      switch(trackedStat.type) {
        case 'R':
          break;
        case 'S':
          statisticStart=state.skills[trackedStat.name];
          break;
        case 'T':
          statisticStart=state.talents[trackedStat.name];
          break;
      }

      // Initialize all affected resources
      affected.forEach(x => state.resources[x] || (state.resources[x] = 0));
      if (affected.includes('soul')) {
        state.resources.nonDungeonSS = (state.resources.nonDungeonSS || 0)
        state.resources.expectedSS = (state.resources.expectedSS || 0)
      }

      // Initialize the display element for the total amount of mana used
      if(container){
        this.totalDisplay.innerHTML = this.update.totalDisplay;
        this.totalDisplay.parentElement.classList.add('expired');
      }

      // Initialize cached variables outside of the loop so we don't have to worry about initializing them on hit/miss in two separate places
      let isValid = false;
      let loop = 0;
      let finalIndex=actions.length-1;
      while ((finalIndex>0) && (actions[finalIndex].disabled || actions[finalIndex].loops === 0)) {
        finalIndex--;
      }


      // If id != update.id, then another update was triggered and we need to stop processing this one
      const id = this.#nextUpdateId++;
      // console.debug(`Starting predictor update ${id} (last update ${this.update.id})`);
      this.update.id = id;
      const runData = {
        id,
        options,
        actions,
        isDebug,
        snapshots,
        affected,
        state,
        total,
        cacheIsValid,
        statisticStart,
        newStatisticValue,
        isValid,
        loop,
        finalIndex,
      };
      for await (const [i, state, isValid] of options.predictorBackgroundThread && this.worker ? this.doBackgroundUpdate(runData) : this.doUpdate(runData)) {
        if (i === finalIndex && typeof state.resources.finLoops !== "undefined" && !affected.includes("finLoops")) {
          affected.unshift('finLoops');
        }

        // Update the snapshots
        for (const snapType in snapshots) {
          // console.log(`snapping ${snapType}:`,snapshots[snapType],state[snapType]);
          snapshots[snapType].snap(state[snapType]);
        }

        const listedAction = actions[i];
        /**
         * Element for the action in the list
         * @type {Element}
         */
        let div = container ? container.children[i] : null;

        // Update the view
        if (div) {
          div.querySelector('ul.koviko').outerHTML = this.template(listedAction.name, affected, state.resources, snapshots, isValid);
        }

      }
      if (this.update.id === id) {
        await this.finishUpdate(container, runData);
        performance.mark("end-predictor-update");
        const updateTime = performance.measure("predictor-totalupdate", "start-predictor-update", "end-predictor-update");

        if (this.updateHadNaNs) {
          this.updateHadNaNs = false;
          view.requestUpdate("updateNextActions");
        }
        // console.debug(`Performed update ${id} in ${updateTime.duration}`, updateTime);
      } else {
        console.debug(`Predictor update ${id} interrupted by ${this.update.id}`);
      }
      return runData;
    }

    /** @param {PredictorRunData} runData @returns {AsyncGenerator<[number, PredictorRunState, boolean]>}  */
    async *doBackgroundUpdate(runData) {
      const {
        id: updateId,
        finalIndex,
        affected,
      } = runData;
      Data.recordSnapshot("predictor-worker");
      this.backgroundSnapshot = Data.getSnapshot(-1);
      const snapshotHeritage = this.backgroundSnapshot.getHeritage().map(s => s.id);
      this.worker.postMessage({type: "setOptions", options});
      this.worker.postMessage({
        type: "startUpdate",
        runData,
        snapshotHeritage,
      });
      while (true) {
        const message = await this.nextWorkerMessage(updateId);
        const {type} = message;
        switch (type) {
          case "endUpdate":
            Object.assign(runData, message.runData);
            return;
          case "update":
            const {i, state, isValid} = message;
            yield [i, state, isValid];
            break;
        }
      }
    }

    /** @param {PredictorRunData} runData */
    async workerUpdate(runData) {
      const {id, snapshots} = runData;
      for await (const [i, state, isValid] of this.doUpdate(runData)) {
        postMessage({type:"update", id, i, state, isValid});
      }
      postMessage({type:"endUpdate", id, runData});
    }

    /**
     * doUpdate is the workhorse of the predictor. It can run either in the UI thread (when predictorBackgroundThread is off)
     * or in the Worker thread, so it must not use any UI functions or elements, either directly or indirectly
     * @param {PredictorRunData} runData
     * @returns {AsyncGenerator<[number, PredictorRunState, boolean]>}
     * @this {this & {update: {
     *  totalDisplay?: string,
     *  pre?: NodeListOf<Element>,
     *  id?: number,
     * }}}
     */
    async *doUpdate(runData) {
      const {
        id,
        options,
        actions,
        isDebug,
        snapshots,
        affected,
        finalIndex,
      } = runData;
      let {
        state,
        total,
        cacheIsValid,
        statisticStart,
        newStatisticValue,
        isValid,
        loop,
      } = runData;
      this.update.id = id;

      const runInfo = await new (this.isWorker
        ? class WorkerRunInfo {
          async start() {
            performance.mark("enter-predictor-worker");
            await delay(0);
            this.nextPause = performance.now() + 50; // pause every 50 ms
            performance.mark("start-predictor-worker");
            const initdelay = performance.measure("predictor-worker-initdelay", "enter-predictor-worker", "start-predictor-worker");
            // console.log(`Initial delay time = ${initdelay.duration}`);
            return this;
          }
          async pauseIfNeeded() {
            if (performance.now() >= this.nextPause) {
              await delay(0); // a backgrounded predictor only needs to pump the event queue every so often
              this.nextPause = performance.now() + 50;
              return true;
            }
            return false;
          }
          finish() {}
        }
        : class IdleRunInfo {
        async start() {
          performance.mark("enter-predictor-idle");
          performance.measure("predictor-preidle", "start-predictor-update", "enter-predictor-idle");
          this.deadline = await nextIdle();
          const timeRemaining = this.deadline.timeRemaining();
          this.lastMark = this.#mark("start-predictoridle", timeRemaining);
          return this;
        }

        async pauseIfNeeded() {
          let timeRemaining = this.deadline.timeRemaining();
          if (timeRemaining <= 1) {
            const pauseMark = this.#mark("pause-predictoridle", timeRemaining);
            performance.measure("predictoridle-cycle", this.lastMark.name, pauseMark.name);
            this.deadline = await nextIdle();
  
            timeRemaining = this.deadline.timeRemaining();
            this.lastMark = this.#mark("continue-predictoridle", timeRemaining);
            return true;
          }
          return false;
        }

        finish() {
          const timeRemaining = this.deadline.timeRemaining();
          const finishMark = this.#mark("finish-predictoridle-loop", timeRemaining);
          performance.measure("predictoridle-cycle", this.lastMark.name, finishMark.name);
        }

        #mark(name, timeRemaining) {
          return performance.mark(`${name}:${timeRemaining}`, { detail: { timeRemaining } });
        }
      })().start();

      // Run through the action list and update the view for each action
      for(const [i, listedAction] of actions.entries()) {
        if (await runInfo.pauseIfNeeded() && id != this.update.id) return;

        // If the cache hit the last time
        let cache = cacheIsValid && i !== finalIndex ? this.cache.next([listedAction.name, listedAction.loops, listedAction.disabled]) : null;

          // Pull out all the variables we would usually expensivly calculate
          if(cache) {
            [state, total, isValid] = cache
        } else {
          cacheIsValid = false;
        }

        /** @type {Koviko_Prediction} */
        let prediction = this.predictions[listedAction.name];

        if (prediction) {
          let repeatLoop = options.predictorRepeatPrediction && options.repeatLastAction && (i == finalIndex) && (prediction.action.allowed==undefined);

          if(!cache || i == finalIndex) {
            // Reinitialise variables on cache miss
            isValid = (prediction.action.townNum==state.resources.town);

            /** @type {number} */
            let currentMana;

            // Make sure that the loop is properly represented in `state.progress`
            if (prediction.loop && !(prediction.name in state.progress)) {
              /** @type {Koviko_Predictor_Progression} */
              state.progress[prediction.name] = {
                progress: 0,
                completed: 0,
                total: towns[prediction.action.townNum]['total' + prediction.action.varName],
              };
            }

            state.resources.actionTicks=0;

            // Complicated mess of ifs to use the cache for 90% of the last action

            if(i == finalIndex && cache){
              let key = [listedAction.name, listedAction.disabled];
              key['last'] = true;
              let lastcache = this.cache.next(key);

              if(lastcache && lastcache[1] < listedAction.loops){
                [state, loop, total, isValid] = lastcache;

                // Invalidate the entry if it's from less than 90% through (it'll be set again once it gets to 90%)
                if(loop <= Math.floor(listedAction.loops * 0.9)){
                  this.cache.miss(true);
                }
              } else {
                loop = 0;
                this.cache.miss(true);
              }
            } else {
              loop = 0;
            }

            // Predict each loop in sequence
            if (isValid) {
              for (loop; repeatLoop ? isValid : loop < listedAction.loops; loop++) {
                let canStart = typeof(prediction.canStart) === "function" ? prediction.canStart(state.resources) : prediction.canStart;
                if (!canStart) { isValid = false; }
                if ( !canStart || listedAction.disabled ) { break; }

                // Save the mana prior to the prediction
                currentMana = state.resources.mana;

                // Skip EXP calculations for the last element, when no longer necessary (only costs 1 mana)
                if ((i==finalIndex) && (prediction.ticks()==1) &&(!prediction.loop) &&(loop>0)) {
                  state.resources.mana--;
                // @ts-ignore
                } else if (prediction.loop && prediction.loop.max &&((prediction.loop.max(prediction.action)*prediction.action.segments)<=state.progress[prediction.name].completed)) {
                  break;
                } else {
                  // Run the prediction
                  this.predict(prediction, state);
                }

                // Check if the amount of mana used was too much
                isValid = isValid && state.resources.mana >= 0;

                // Only for Adventure Guild
                if ( listedAction.name == "Adventure Guild" ) {
                  state.resources.mana -= state.resources.adventures * 200;
                }

                // Calculate the total amount of mana used in the prediction and add it to the total
                total += currentMana - state.resources.mana;



                // Calculate time spent
                // @ts-ignore
                let temp = (currentMana - state.resources.mana) / getSpeedMult(state.resources.town);
                state.resources.totalTicks += temp;
                state.resources.actionTicks+=temp;

                // Only for Adventure Guild
                if ( listedAction.name == "Adventure Guild" ) {
                  state.resources.mana += state.resources.adventures * 200;
                }

                if (repeatLoop&& !isValid) {break;}

                // Run the effect, now that the mana checks are complete
                if (prediction.effect) {
                  // @ts-ignore
                  prediction.effect(state.resources, state.skills);
                }
                if (prediction.loop) {
                  if (prediction.loop.effect.end) {
                    prediction.loop.effect.end(state.resources, state.skills);
                  }
                }

                // Add to cache 90% through the final action
                if(i==finalIndex && loop === Math.floor(listedAction.loops * 0.9)){
                  let key = [listedAction.name, listedAction.disabled];
                  key['last'] = true;
                  this.cache.add(key, [state, loop + 1, total, isValid]);
                }

                // If id != update.id, then another update was triggered and we need to stop processing this one
                if (await runInfo.pauseIfNeeded() && id != this.update.id) return;
              }
            }

            if (repeatLoop&& loop>=listedAction.loops) {
              isValid=true;
            }


            if(prediction.name in state.progress){
              state.currProgress[prediction.name] = state.progress[prediction.name].completed / prediction.action.segments;
              state.toNextLoop[prediction.name] = state.progress[prediction.name].progress!=0?state.progress[prediction.name].progress/state.progress[prediction.name].loopTotalCost:0;
            }
            // Update the cache
            if(i!==finalIndex) this.cache.add([listedAction.name, listedAction.loops, listedAction.disabled], [state, total, isValid]);

          }

            if (typeof(repeatLoop) !== 'undefined' && repeatLoop) {
              state.resources.finLoops=loop;
            }
          yield [i, state, isValid];
        }
      }

      runInfo.finish();
      Object.assign(runData, {
        state,
        total,
        cacheIsValid,
        statisticStart,
        newStatisticValue,
        isValid,
        loop,
      });
    }
    /** @param {HTMLElement} container  @param {PredictorRunData} runData  */
    async finishUpdate(container, runData) {
      const {
        state,
        total,
        statisticStart,
        isDebug,
        loop,
        finalIndex,
        affected,
        actions,
      } = runData;
      let {
        newStatisticValue,
      } = runData;

      const trackedStat = Koviko.trackedStats[options.predictorTrackedStat];

      let totalMinutes = state.resources.totalTicks / 50 / 60

      let legend="";

      switch(trackedStat.type) {
        case 'R':
          if (trackedStat.name=="soul") {
            let dungeonEquilibrium = Math.min(Math.sqrt(total / 200000),1);
            let dungeonSS = state.resources.soul - state.resources.nonDungeonSS;
            newStatisticValue = (state.resources.nonDungeonSS + dungeonEquilibrium * (dungeonSS || 0)) / totalMinutes;
            legend="SS";
          } else if (trackedStat.name=="soulNow") {
            newStatisticValue = (state.resources.expectedSS+state.resources.nonDungeonSS) / totalMinutes;
            legend="SS Expected";
          } else if (trackedStat.name=="act") {
            let finalAction = actions[finalIndex];
            if (finalAction.disabled) {
              // Find the last non-disabled action
              for (let i = finalIndex - 1; i >= 0; i--) {
                if (!actions[i].disabled) {
                  finalAction = actions[i];
                  break;
                }
              }
            }
            newStatisticValue = state.resources.finLoops / totalMinutes;
            legend = finalAction.name;
          } else if (trackedStat.name=="survey") {
            newStatisticValue= getExploreSkill()* (state.resources.completedMap+3*state.resources.submittedMap)  / totalMinutes;
            legend="Survey";
          } else if (trackedStat.name=="invest") {
            newStatisticValue= state.resources.invested / totalMinutes;
            legend="Investment";
          }
          break;
        case 'TIME':
          if (trackedStat.name=="tillKey") {
            let goldTillKey = 1000000;
            let i_rate = 0.001;
            // This is a re-arranged 'compound interest with contributions' formula solving for the number of iterations
            // required to reach `goldTillKey / i_rate`, when you can collect enough gold from interest.
            // The actual implementation rounds your interest each loop, so this is slightly innacurate.
            let loopsNeeded = Math.log((goldTillKey + state.resources.invested)/(goldInvested*i_rate + state.resources.invested))/Math.log(i_rate + 1);
            newStatisticValue= loopsNeeded * state.resources.totalTicks; // Estimate of total ticks until we can buy the key
            legend="till key";
          }
          break;
        case 'S':
          newStatisticValue=(state.skills[trackedStat.name]-statisticStart)/ totalMinutes;
          legend=this.getShortSkill(trackedStat.name);
          break;
        case 'T':
          newStatisticValue=(state.talents[trackedStat.name]-statisticStart)/ totalMinutes;
          legend=_txt('stats>'+trackedStat.name+'>short_form');
          break;
      }


      // Update the display for the total amount of mana used by the action list
      container && (this.totalDisplay.innerHTML = intToString(total) + " | " + this.timeString(state.resources.totalTicks) + " | " );
      switch(trackedStat.type) {
        case 'TIME':
          container && (this.statisticDisplay.innerHTML = this.timeString(newStatisticValue||0) + " " + legend);
          break;
        default:
          container && (this.statisticDisplay.innerHTML = intToString(newStatisticValue||0) + " " + legend + "/min");
      }

      if (this.resourcePerMinute>newStatisticValue) {
        this.statisticDisplay.style.color='var(--predictor-worse-color)';
      } else {
        this.statisticDisplay.style.color='var(--predictor-better-color)'
      }
     this.resourcePerMinute=newStatisticValue;

     this.totalDisplay.parentElement.classList.remove('expired');

      if (getNumOnCurList("Open Portal")>0 && (getNumOnList("Open Portal")==0)) {
        this.totalDisplay.innerHTML +="PORTAL MISSING";
        this.totalDisplay.style.color="var(--predictor-warning-color)";
      } else {
        this.totalDisplay.style.color="";
      }

      // Log useful debugging data
      if (isDebug) {
        console.info({
          actions: actions,
          affected: affected,
          state: state,
          total: total
        });
      }
      this.state = state;

      // Fire an event when a prediction finishes for other scripts to hook into
      document.dispatchEvent(new Event('predictor-update'));
    }

    timeString(ticks) {
      let seconds = ticks / 50;
      let h = Math.floor(seconds / 3600);
      let m = Math.floor(seconds % 3600 / 60);
      let s = Math.floor(seconds % 3600 % 60);
      let ms = Math.floor(seconds % 1 * Math.pow(10,options.predictorTimePrecision)).toString();
      while(ms.length < options.predictorTimePrecision) { ms = "0" + ms; }

      return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2) + "." + ms;
    }

    getShortSkill(name) {
      switch(name) {
        case "chronomancy":
          return 'CHRO';
        case "crafting":
          return 'CRAFT';
        case "pyromancy":
          return 'PYRO';
        case "alchemy":
          return 'ALCH';
        case "combat":
          return 'COMB';
        case "practical":
          return 'PRACT';
        case "restoration":
          return 'RESTO';
        case "spatiomancy":
          return 'SPACE';
        case "mercantilism":
          return 'MERC';
        case "divine":
          return 'DIVI';
        case "commune":
          return 'COMU';
        case "wunderkind":
          return 'WUKID';
        case "gluttony":
          return 'GLUTT';
        case "thievery":
          return 'THIEF';
        case "leadership":
          return 'LEAD';
        case "assassin":
          return 'ASSA';
        default:
          return name.toUpperCase();
      }
    }

    /**
     * Generate the element showing the resources accumulated for an action in the action list.
     * @param {Array.<string>} affected Names of resources to display
     * @param {string} currname Name of the snapshot on hoverover
     * @param {Koviko_Predictor_Resources} resources Accumulated resources
     * @param {Object} snapshots Snapshots with value comparisons
     * @param {Koviko_Snapshot} snapshots.stats Value comparisons of stats from one snapshot to the next
     * @param {Koviko_Snapshot} snapshots.skills Value comparisons of skills from one snapshot to the next
     * @param {Koviko_Snapshot} snapshots.currProgress
     * @param {Koviko_Snapshot} snapshots.toNextLoop
     * @param {boolean} isValid Whether the amount of mana remaining is valid for this action
     * @return {string} HTML of the new element
     * @memberof Koviko.Predictor
     */
    template(currname, affected, resources, snapshots, isValid) {
      const isValidStr = isValid ? 'valid' : 'invalid';
      let stats = snapshots.stats.get();
      let skills = snapshots.skills.get();
      let currProgress = snapshots.currProgress.get();
      let toNextLoop = snapshots.toNextLoop.get();
      let tooltip = '<tr><th colspan="3"><b>' + currname + '</b></th><tr>';

      for (let i in stats) {
        if (stats[i].delta) {
          let level = {
            start: getLevelFromExp(stats[i].value - stats[i].delta),
            end: getLevelFromExp(stats[i].value),
          };

          tooltip += '<tr><td><b>' + _txt(`stats>${i}>short_form`).toUpperCase() + '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
        }
      }

      for (let i in skills) {
        if (skills[i].delta) {
          let level = {
            start: getSkillLevelFromExp(skills[i].value - skills[i].delta),
            end: getSkillLevelFromExp(skills[i].value),
          };

          tooltip += '<tr><td><b>'
          tooltip+=this.getShortSkill(i);
          if (level.end>level.start) {
            tooltip += '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
          } else {
            tooltip += '<td>' +Math.floor(skills[i].delta/(level.end+1)*100)/100 +'%</td><td><' + intToString(skills[i].delta, 1) + '></td></tr>';
          }
        }
      }

      for (let i in currProgress) {
        if (currProgress[i].delta) {
          let level = {
            start: currProgress[i].value - currProgress[i].delta,
            end: currProgress[i].value,
          };

          tooltip += '<tr><td><b>'
          switch(i) {
            case "Fight Monsters":
              tooltip += 'MON';
              break;
            case "Heal The Sick":
              tooltip += 'PT';
              break;
            case "Small Dungeon":
              tooltip += 'SD';
              break;
            case "Large Dungeon":
              tooltip += 'LD';
              break;
            case "Hunt Trolls":
              tooltip += 'TROL';
              break;
            case "Tidy Up":
              tooltip += 'TIDY';
              break;
            case "Fight Frost Giants":
              tooltip += 'FROST';
              break;
            case "The Spire":
              tooltip += 'SPIRE';
              break;
            case "Fight Jungle Monsters":
              tooltip += 'J MON';
              break;
            case "Rescue Survivors":
              tooltip += 'SURV';
              break;
            case "Secret Trial":
              tooltip += 'SECRET';
              break;
            case "Heroes Trial":
              tooltip += 'HERO';
              break;
            case "Dead Trial":
              tooltip += 'DEAD';
              break;
            case "Gods Trial":
              tooltip += 'GODS';
              break;
            case "Challenge Gods":
              tooltip += 'CHAL';
              break;
            default:
              tooltip += i.toUpperCase();
          }
          tooltip += '</b></td><td>' + intToString(level.end, 1) + '</td><td>(+' + intToString(level.end - level.start, 1) + ')</td></tr>';
        }
      }
      if (toNextLoop[currname] && toNextLoop[currname].value>0){
          tooltip += '<tr><td><b>NEXT</b><td>' +Math.floor(toNextLoop[currname].value*100*Math.pow(10,options.predictorNextPrecision))/Math.pow(10,options.predictorNextPrecision) +'%</td><td></td></tr>';
      }
      //Timer
      tooltip+= '<tr><td><b>TIME</b></td><td>' + precision3(resources.totalTicks/50) + '</td><td>(+' + precision3(resources.actionTicks/50) + ')</td></tr>';

      var Affec = affected.map(name => {
        if (isNaN(resources[name])) this.updateHadNaNs = true;
        if ( resources[name] != 0 ) return `<li class="${name}" title="${capitalizeFirst(name)}: ${isNaN(resources[name])?"???":formatNumber(resources[name])}">${isNaN(resources[name])?"?":intToString(resources[name], 1)}</li>`;
        else return "";
      }).join('');
      return `<ul class='koviko ${isValidStr}'>` + Affec + `<div class='koviko showthis'><table>${tooltip || '<b>N/A</b>'}</table></div></ul>`;
    };

    /**
     * Perform one tick of a prediction.
     * @param {Koviko_Prediction} prediction Prediction object
     * @param {Koviko_Predictor_State} state State object
     * @return {boolean} Whether another tick can occur
     * @memberof Koviko.Predictor
     */
    tick(prediction, state) {
      // Apply the accumulated stat experience, not for 0 Exp actions (Secret Trial & Restore Time)
      // @ts-ignore
      if (prediction.action.expMult!=0) prediction.exp(prediction.action, state.stats,state.talents,state.soulstones);

      // Handle the loop if it exists
      if (prediction.loop) {
        /** @type {Koviko_Predictor_Progression} */
        const progression = state.progress[prediction.name];

        /** @type {function} */
        const loopCost = prediction.loop.cost(progression, prediction.action);

        /** @type {function} */
        const tickProgress = prediction.loop.tick(progression, prediction.action, state.stats, state.skills, state.resources);

        /** @type {number} */
        const totalSegments = prediction.action.segments;

        /** @type {number} */
        const maxSegments = prediction.loop.max ? prediction.loop.max(prediction.action) * totalSegments : Infinity;

        // Helper for caching cost Calculations
        if (!progression.costList) {
          progression.costList=[];
          var loopTotalCost = 0;
          for (let i=0; i<totalSegments ; i++ ) {
            progression.costList[i]=loopCost(i);
            loopTotalCost +=loopCost(i);
          }
          progression.loopTotalCost = loopTotalCost;
        }
        /**
         * Current segment within the loop
         * @type {number}
         */
        let segment = 0;

        /**
         * Progress through the current loop
         * @type {number}
         */
        let progress = progression.progress;

        // Calculate the progress and current segment before the tick
        for (; progress >= progression.costList[segment]; progress -= progression.costList[segment++]);

        /**
         * Progress of the tick
         * @type {number}
         */
        let additionalProgress = tickProgress(segment) * (prediction.baseManaCost(prediction.action) / prediction.ticks());

        // Accumulate the progress from the tick
        progress += additionalProgress;
        progression.progress += additionalProgress;

        // Calculate the progress and current segment after the tick
        while (progress >= progression.costList[segment] && progression.completed < maxSegments) {
          progress -= progression.costList[segment++];
          // Handle the completion of a loop
          if (segment >= totalSegments) {
            progression.progress = 0;
            progression.completed += totalSegments;
            progression.total++;
            segment -= totalSegments;

            // Apply the effect from the completion of a loop
            if (prediction.loop.effect.loop) {
              prediction.loop.effect.loop(state.resources, state.skills,state.soulstones,state.talents);
            }

            // Store remaining progress in next loop if next loop is allowed
            if (progression.completed < maxSegments) {
              progression.progress = progress;
              //Helper for  caching cost Calculations
              var loopTotalCost = 0;
              //Helper for  caching cost Calculations
              for (let i=0;i<totalSegments;i++) {
                progression.costList[i]=loopCost(i);
                loopTotalCost += loopCost(i);
              }
              progression.loopTotalCost = loopTotalCost
            }
          }

          // Apply the effect from the completion of a segment
          if (prediction.loop.effect.segment) {
            prediction.loop.effect.segment(state.resources, state.skills);
          }
        }

        return additionalProgress && segment < maxSegments;
      }

      return true;
    }

    /**
     * Perform all ticks of a prediction
     * @param {Koviko_Prediction} prediction Prediction object
     * @param {Koviko_Predictor_State} state State object
     * @memberof Koviko.Predictor
     */
    predict(prediction, state) {
      // Update the amount of ticks necessary to complete the action, but only once at the start of the action
      // @ts-ignore
      prediction.updateTicks(prediction.action, state.stats, state);

      // Perform all ticks in succession
      for (let ticks = 0; ticks < prediction.ticks(); ticks++) {
        state.resources.mana--;
        if (state.resources.mana >= 0) {
            if (!this.tick(prediction, state)) break;
        }
      }
    }
  },

  predictor: null,

  /** @return {Predictor} */
  get instance() {
    if (!this.predictor) {
      this.predictor = new Koviko.Predictor();
    }
    return this.predictor;
  },

  initWorkerPredictor() {
    this.predictor = new Koviko.Predictor(true);
    return this.instance;
  },

  preUpdateHandler(container) {
    this.instance.preUpdate(container);
  },
  postUpdateHandler(nextActions, container) {
    this.instance.update(nextActions, container);
  },
};

/** @typedef {InstanceType<(typeof Koviko)["Snapshot"]>} Koviko_Snapshot */
/** @typedef {InstanceType<(typeof Koviko)["Prediction"]>} Koviko_Prediction */
/** @typedef {InstanceType<(typeof Koviko)["Predictor"]>} Predictor */
/**
 * @template {*} K
 * @template {*} R
 * @template {*} T
 * @typedef {InstanceType<typeof Koviko.Cache<K,R,T>>} PredictorCache
 */

/** @typedef {Awaited<ReturnType<Predictor["update"]>>} PredictorRunData */
/** @typedef {Predictor["initState"]} PredictorRunState */
