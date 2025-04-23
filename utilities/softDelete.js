import { db } from "../config/config.js";

const softDelete = async ({ table, id, idColumn = "id" }) => {
  try {
    if (!id) {
      throw new Error("ID is required for deletion.");
    }

    // Soft delete by setting the `deleted` column to 1
    let sql = `UPDATE ${table} SET deleted = 1 WHERE ${idColumn} = ?`;

    const [results, fields] = await db.execute(sql, [id]);

    // console.log("affected rows", results.affectedRows);

    if (!results.affectedRows) {
      //   return 0; // No rows were affected, possibly invalid ID
      throw new GraphQLError("No data that matched the provided id!");
    }

    return { id, action: "deleted" }; // Return confirmation of deletion
  } catch (error) {
    console.error("Error deleting data:", error);
    throw new Error("Failed to delete data."); // Rethro
  }
};

export default softDelete;
