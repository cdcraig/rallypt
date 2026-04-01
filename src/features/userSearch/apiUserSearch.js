import supabase from "../../services/supabase";

export async function searchPeople(query) {
  // Strip characters that are meaningful in PostgREST filter strings to prevent injection
  const safe = query.replace(/[(),]/g, "");

  let { data: results, error } = await supabase
    .from("users")
    .select("*")
    .or(
      `fullname.ilike.%${safe}%,username.ilike.%${safe}%,email.ilike.%${safe}%`,
    );

  if (error) throw new Error(error.message);

  return results;
}
