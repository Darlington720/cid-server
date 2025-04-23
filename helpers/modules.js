import { baseUrl, db } from "../config/config.js";

export const getModules = async ({ id, role_id } = {}) => {
  try {
    let where = "";
    let values = [];
    let extra_join = "";

    if (id) {
      where = " AND id = ?";
      values.push(id);
    }

    if (role_id) {
      where += " AND role_modules.role_id = ?";
      extra_join +=
        " INNER JOIN role_modules ON role_modules.module_id = apps.id";
      values.push(role_id);
    }

    let sql = `SELECT 
        apps.* 
        FROM apps
        ${extra_join} 
        WHERE deleted = 0 ${where} ORDER BY sort ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);

    const updatedModules = results.map((item) => {
      return {
        ...item,
        logo: item.logo ? `${baseUrl}${item.logo}` : null,
      };
    });

    // console.log("updatedModules", updatedModules);

    return updatedModules;
  } catch (error) {
    return { error: error.message };
  }
};
