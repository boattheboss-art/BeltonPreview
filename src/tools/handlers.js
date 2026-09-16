const { queryDB } = require('../db/database.js');
const { searchSlideKnowledge } = require('../knowledge/slide_knowledge_db.js');

async function executeTool(name, args) {
  console.log(`⚡ [Tool Execution] Executing "${name}" with args:`, JSON.stringify(args));

  switch (name) {
    case 'get_machine_telemetry': {
      const machineNum = parseInt(args.machine_num, 10);
      if (isNaN(machineNum) || machineNum < 1 || machineNum > 50) {
        return { error: 'Invalid machine number. Must be between 1 and 50.' };
      }
      const rows = await queryDB('SELECT * FROM machines WHERE id = ?', [machineNum]);
      if (rows.length === 0) return { error: `Machine #${machineNum} not found in database.` };
      return rows[0];
    }

    case 'get_problematic_machines': {
      let sql = "SELECT * FROM machines WHERE status != 'ACTIVE' ORDER BY yield_rate ASC";
      if (args.filter === 'critical_only') {
        sql = "SELECT * FROM machines WHERE status = 'MAINTENANCE_HOLD' ORDER BY yield_rate ASC";
      } else if (args.filter === 'warning_only') {
        sql = "SELECT * FROM machines WHERE status = 'WARNING' ORDER BY yield_rate ASC";
      }
      const rows = await queryDB(sql);
      return {
        total_problem_count: rows.length,
        machines: rows
      };
    }

    case 'get_factory_overall_summary': {
      const rows = await queryDB(`
        SELECT 
          count(*) as total_machines,
          sum(case when status = 'ACTIVE' then 1 else 0 end) as active_count,
          sum(case when status != 'ACTIVE' then 1 else 0 end) as problem_count,
          avg(yield_rate) as average_yield,
          sum(total_shots) as total_shots,
          sum(pass_count) as total_pass,
          sum(defect_count) as total_defect
        FROM machines
      `);
      return rows[0];
    }

    case 'teleport_3d_camera': {
      const machineNum = parseInt(args.machine_num, 10);
      return {
        action: 'teleport',
        type: 'teleport',
        targetNum: machineNum,
        status: 'success',
        message: `วาร์ปกล้อง 3D ไปที่เครื่อง ACA-DISP-${machineNum < 10 ? '0' + machineNum : machineNum} เรียบร้อย`
      };
    }

    case 'search_training_slides': {
      const query = args.query || '';
      const results = searchSlideKnowledge(query, 3);
      if (results.length === 0) {
        return { message: `ไม่พบข้อมูลสไลด์ที่ตรงกับคำค้นหา "${query}"` };
      }
      return {
        query: query,
        total_found: results.length,
        slides: results
      };
    }

    default:
      return { error: `Tool "${name}" is not recognized.` };
  }
}

module.exports = { executeTool };
