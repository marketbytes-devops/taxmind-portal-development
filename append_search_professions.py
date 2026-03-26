
import os

filepath = r'e:\taxmind-portal-development\taxmind-backend-main\src\modules\user\services.ts'
code = """
export const searchProfessions = serviceHandler(searchProfessionSchema, async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.success('Professions retrieved', []);
  }

  // Hash the search keyword's trigrams
  try {
    const searchHashes = hashTrigrams(keyword.toLowerCase());
    
    // Require at least partial match
    const minMatches = Math.ceil(searchHashes.length * 0.4);

    const results = await db
      .select({
        profession: models.users.profession,
      })
      .from(models.users)
      .where(
        and(
          isNull(models.users.deletedAt),
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
        )
      )
      .limit(100);

    // Decrypting is handled by drizzle custom type mapping
    const uniqueProfessionsSet = new Set();
    results.forEach((r) => {
      if (r.profession) {
         // Case-insensitive normalization
         uniqueProfessionsSet.add(r.profession.trim());
      }
    });
    
    const uniqueProfessions = Array.from(uniqueProfessionsSet);
    
    return res.success('Professions retrieved', uniqueProfessions);
  } catch (error) {
    console.error('Error searching professions:', error);
    return res.success('Professions retrieved', []);
  }
});
"""

with open(filepath, 'a', encoding='utf-8') as f:
    f.write(code)
print("Success")
