/* ============================================================
   KNOWLEDGE GRAPH — the data model.

   This file is the only place to edit the map. The renderer
   (graph.js) draws whatever it finds here.

   NODES
     id          unique, kebab-case
     label       what the visitor reads
     type        'synthesis' | 'cluster' | 'skill' | 'artifact'
     parent      for skills: the cluster hub it sits around
     cluster     display name of the group it belongs to
     desc        one line. Keep it one line.
     x, y        hubs, synthesis and artifact only, in viewBox units
                 (skills are placed automatically around their parent)

   A skill belongs to one parent for layout, but may be joined to any
   number of other nodes by an edge — that is what makes this a network
   rather than ten lists. Variance analysis, root cause and
   accountability are each shared this way.

   EDGES
     [source, target, kind]
     kind: 'branch'    hub → its own skills (structural, faintest)
           'concept'   a relationship across clusters
           'synthesis' something feeding a synthesis node
           'artifact'  something expressed in Manufacture Terminal

   LAYOUT
     arc.spread is how wide (in degrees) a cluster opens; arc.r is how far
     its skills sit from the hub. By default a cluster faces away from the
     centre of the map, which keeps the middle clear for the synthesis
     spine — set arc.start explicitly only to override that.
   ============================================================ */

window.KNOWLEDGE = (function () {

  const clusters = [
    { id:'strategy',    n:'01', label:'Strategy',                x: 205, y: 315, arc:{spread:150, r:110},
      desc:'Where the business is going, and what it will not do.' },
    { id:'finance',     n:'02', label:'Finance',                  x: 520, y: 250, arc:{spread:170, r:112},
      desc:'The economics underneath the operation, in the language the board reads.' },
    { id:'operations',  n:'03', label:'Operations',               x: 890, y: 250, arc:{spread:170, r:118},
      desc:'Making the plant produce — capability, constraint and flow.' },
    { id:'capital',     n:'04', label:'Capital Allocation',       x:1205, y: 315, arc:{spread:170, r:112},
      desc:'Directing scarce capital toward the strongest strategic and economic return.' },
    { id:'quality',     n:'05', label:'Quality & Excellence',     x:1130, y: 605, arc:{spread:150, r:110},
      desc:'Holding the process to a standard, and then improving the standard.' },
    { id:'performance', n:'06', label:'Performance Management',   x: 800, y: 585, arc:{spread:140, r:104},
      desc:'Making performance measurable, owned, and acted on.' },
    { id:'data',        n:'07', label:'Data & Analytics',         x: 450, y: 610, arc:{spread:170, r:110},
      desc:'Turning operating records into evidence a manager can use.' },
    { id:'governance',  n:'10', label:'Governance',               x: 195, y: 560, arc:{spread:140, r:100},
      desc:'Who decides what, on what basis, and who answers for it.' },
    { id:'digital',     n:'09', label:'Digital / AI',             x:1175, y: 830, arc:{spread:170, r:105},
      desc:'Systems that do the work rather than describe it.' }
  ];

  const synthesis = [
    { id:'systems-thinking', label:'Business Systems Thinking', x: 700, y:  55,
      desc:'Connecting strategy, economics, operations, people, capital and information into coherent management systems.' },
    { id:'decision-intelligence', n:'08', label:'Decision Intelligence', x: 620, y: 855, arc:{spread:170, r:112},
      desc:'Turning business data, context and analysis into better management decisions.' },
    { id:'digital-transformation', label:'Digital Transformation', x: 940, y:1010,
      desc:'Making the operating model scalable by putting it into systems.' }
  ];

  const artifact = { id:'manufacture-terminal', label:'Manufacture Terminal', x: 740, y:1150,
    desc:'An integrated manufacturing management system that operationalises performance, financial, quality, procurement, forecasting and decision intelligence.' };

  /* skills: [id, label, parent, description] */
  const skills = [
    ['business-strategy','Business Strategy','strategy','Direction, positioning, and the choices that follow from both.'],
    ['growth','Growth','strategy','Where volume and margin are supposed to come from next.'],
    ['business-economics','Business Economics','strategy','How the business actually makes money, unit by unit.'],
    ['risk','Risk','strategy','What could break the plan, and what it would cost.'],

    ['p-and-l','P&L','finance','Understanding business performance through revenue, cost and profitability.'],
    ['financial-analysis','Financial Analysis','finance','Reading statements for what moved, and why.'],
    ['working-capital','Working Capital','finance','The cash tied up between buying materials and being paid.'],
    ['cash-flow','Cash Flow','finance','Whether the business can fund what it has committed to.'],
    ['cost-structure','Cost Structure','finance','What is fixed, what is variable, and what that means at volume.'],

    ['production','Production','operations','Output against plan, line by line, shift by shift.'],
    ['capacity','Capacity','operations','What the plant can actually run, and what limits it.'],
    ['ppic','PPIC','operations','Planning and inventory control between demand and the line.'],
    ['maintenance','Maintenance','operations','Keeping equipment available rather than repairing failure.'],
    ['procurement','Procurement','operations','Input prices, supplier exposure, and when to buy.'],
    ['workforce','Workforce','operations','Manning the process — structure, shifts and overtime.'],
    ['productivity','Productivity','operations','Output per unit of input, and where it is lost.'],

    ['capex','CAPEX','capital','Capital spent to add, restore or modernise capability.'],
    ['roi','ROI','capital','What the investment returns against what it consumed.'],
    ['irr','IRR','capital','The rate a project earns over its own life.'],
    ['payback','Payback','capital','How long before the investment is repaid.'],
    ['financing','Financing','capital','Structuring the funding, including debt the lender must accept.'],
    ['investment-governance','Investment Governance','capital','The rules a proposal must pass before it becomes a commitment.'],

    ['quality-management','Quality Management','quality','The system that holds product to a defined standard.'],
    ['copq','COPQ','quality','What failure costs, split between what is caught and what escapes.'],
    ['root-cause-analysis','Root Cause Analysis','quality','Finding the mechanism, not the symptom.'],
    ['capa','CAPA','quality','Corrective action, and evidence that it held.'],
    ['process-improvement','Process Improvement','quality','Changing the process so the defect cannot recur.'],
    ['continuous-improvement','Continuous Improvement','quality','Improvement as routine rather than as a project.'],

    ['kpi-architecture','KPI Architecture','performance','Designing metrics and driver relationships that make performance measurable and actionable.'],
    ['targets','Targets','performance','What good looks like, stated before the period starts.'],
    ['drivers','Drivers','performance','The few variables that actually move the number.'],
    ['variance-analysis','Variance Analysis','performance','The gap between plan and actual, decomposed until it reconciles.'],
    ['forecasting','Forecasting','performance','What the next periods look like, and how wrong the last forecast was.'],
    ['accountability','Accountability','governance','An owner and a next date for every decision.'],

    ['business-data','Business Data','data','The operating record: what happened, from the source system.'],
    ['kpi-analysis','KPI Analysis','data','Reading indicators against target, prior period and peer.'],
    ['trend-analysis','Trend Analysis','data','Direction and persistence, separated from noise.'],
    ['driver-analysis','Driver Analysis','data','Attributing a movement to the things that caused it.'],
    ['visualization','Visualization','data','Presenting evidence so the decision is clear.'],

    ['insights','Insights','decision-intelligence','A finding that changes what someone does.'],
    ['decision-support','Decision Support','decision-intelligence','Options, constraints and what each one costs.'],
    ['exception-management','Exception Management','decision-intelligence','Managing by what broke the expectation, not by the whole report.'],
    ['action','Action','decision-intelligence','The decision taken, owned and dated.'],

    ['automation','Automation','digital','Work the system does that a person no longer has to.'],
    ['ai-assisted-analysis','AI-assisted Analysis','digital','Using models to read, summarise and interrogate operating data.'],
    ['information-architecture','Information Architecture','digital','How information is structured so it can be found and trusted.'],
    ['digital-systems','Digital Systems','digital','The platforms the operating model actually runs on.'],

    ['decision-rights','Decision Rights','governance','Who may decide what, and at what threshold.'],
    ['controls','Controls','governance','The checks that keep a process inside its limits.'],
    ['review-systems','Review Systems','governance','The cadence at which performance is examined and answered for.']
  ];

  /* ── Relationships ──────────────────────────────────────────
     Structural branches are generated from `parent`; everything
     below is a deliberate connection. */
  const edges = [
    // cross-cluster relationships
    ['strategy','business-economics','concept'],
    ['business-economics','p-and-l','concept'],
    ['p-and-l','cost-structure','concept'],
    ['p-and-l','performance','concept'],
    ['operations','cost-structure','concept'],
    ['operations','quality','concept'],
    ['operations','capacity','concept'],
    ['quality','copq','concept'],
    ['quality','root-cause-analysis','concept'],
    ['capital','finance','concept'],
    ['capital','strategy','concept'],
    ['capital','operations','concept'],
    ['capex','capacity','concept'],
    ['investment-governance','governance','concept'],
    ['performance','kpi-architecture','concept'],
    ['kpi-architecture','data','concept'],
    ['variance-analysis','data','concept'],
    ['accountability','performance','concept'],
    ['forecasting','data','concept'],
    ['risk','governance','concept'],
    ['strategy','governance','concept'],
    ['workforce','productivity','concept'],
    ['financing','cash-flow','concept'],

    // into decision intelligence
    ['root-cause-analysis','decision-intelligence','synthesis'],
    ['data','decision-intelligence','synthesis'],
    ['governance','decision-intelligence','synthesis'],
    ['performance','decision-intelligence','synthesis'],
    ['business-economics','decision-intelligence','synthesis'],

    // into digital transformation
    ['decision-intelligence','digital-transformation','synthesis'],
    ['data','digital-transformation','synthesis'],
    ['automation','digital-transformation','synthesis'],
    ['ai-assisted-analysis','digital-transformation','synthesis'],
    ['information-architecture','digital-transformation','synthesis'],

    // into business systems thinking
    ['strategy','systems-thinking','synthesis'],
    ['finance','systems-thinking','synthesis'],
    ['operations','systems-thinking','synthesis'],
    ['capital','systems-thinking','synthesis'],
    ['quality','systems-thinking','synthesis'],
    ['performance','systems-thinking','synthesis'],
    ['data','systems-thinking','synthesis'],
    ['governance','systems-thinking','synthesis'],
    ['digital','systems-thinking','synthesis'],
    ['decision-intelligence','systems-thinking','synthesis'],

    // expressed in the artefact
    ['digital-transformation','manufacture-terminal','artifact'],
    ['decision-intelligence','manufacture-terminal','artifact'],
    ['performance','manufacture-terminal','artifact'],
    ['finance','manufacture-terminal','artifact'],
    ['operations','manufacture-terminal','artifact'],
    ['quality','manufacture-terminal','artifact'],
    ['governance','manufacture-terminal','artifact'],
    ['systems-thinking','manufacture-terminal','artifact']
  ];

  return { clusters, synthesis, artifact, skills, edges };
})();
