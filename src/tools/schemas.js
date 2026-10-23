const toolsDefinition = [
  {
    type: 'function',
    function: {
      name: 'get_machine_telemetry',
      description: 'Retrieve real-time SCADA telemetry, Yield rate, total shots, mass (mg), CDA pressure, preheat temperature, needle wear, and AI diagnosis for a specific machine in the cleanroom. Call this whenever a machine number is mentioned (e.g. machine 20, #27, เครื่องที่ 20).',
      parameters: {
        type: 'object',
        properties: {
          machine_num: {
            type: 'integer',
            description: 'The machine index number from 1 to 50'
          }
        },
        required: ['machine_num']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_problematic_machines',
      description: 'Retrieve all machines currently having issues, safety holds, or warnings in the cleanroom fleet. Call this whenever the user asks about broken machines, abnormalities, or fleet issues (e.g. มีเครื่องไหนพังบ้าง, มีปัญหาไหม).',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['all', 'critical_only', 'warning_only'],
            description: 'Filter problem severity'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_factory_overall_summary',
      description: 'Query aggregate cleanroom statistics: total production shots, average yield rate across all 50 machines, normal count, and problem count. Call this when asked about overall factory status or total production.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'teleport_3d_camera',
      description: 'Teleport the 3D cleanroom camera directly to the specified machine location. Call this when user asks to view, look at, or teleport to a machine.',
      parameters: {
        type: 'object',
        properties: {
          machine_num: {
            type: 'integer',
            description: 'Target machine number (1 to 50)'
          }
        },
        required: ['machine_num']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_training_slides',
      description: 'Search the official Belton, Seagate, Western Digital (WD), Hitachi, BYD, Innolight engineering documents (700+ Process Instructions PI and Workmanship Standards SPE, 6000+ pages) for specifications, assembly steps, defect acceptance/rejection criteria, Cleanroom procedures, and standards. Call this whenever technical knowledge, specific customer requirements (Seagate, WD, Hitachi, BYD), PI/SPE procedures, or citations are needed.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword, question, or document code (e.g. Broken wire, PI-01-02-0001, SPE-01-08-01, Hookup WD, BYD PCBA, wet tray, FCOF, silicone, ESD, gowning order, 80%)'
          },
          customer: {
            type: 'string',
            enum: ['all', 'Seagate', 'Western Digital', 'Hitachi', 'BYD', 'Innolight', 'BTW', 'General'],
            description: 'Optional filter by customer/brand if specified in the user query.'
          },
          doc_type: {
            type: 'string',
            enum: ['all', 'PI', 'SPE'],
            description: 'Optional filter by document type: PI (Process Instruction) or SPE (Workmanship Standards).'
          }
        },
        required: ['query']
      }
    }
  }
];

module.exports = { toolsDefinition };
