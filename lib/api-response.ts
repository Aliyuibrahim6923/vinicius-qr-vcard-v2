export type ApiError = {
  error: string;
  fields?: Record<string, string[] | undefined>;
};

export type ApiResult<T> = T | ApiError;

const fieldLabels: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  job_title: "Job title",
  linkedin_url: "LinkedIn URL",
  photo_url: "Photo URL",
};

export function getApiErrorMessage(result: ApiError) {
  const details = Object.entries(result.fields ?? {}).flatMap(([field, messages]) =>
    (messages ?? []).map((message) => `${fieldLabels[field] ?? field.replaceAll("_", " ")}: ${message}`),
  );

  return details.length > 0 ? details.join(" ") : result.error;
}

export async function readApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  const text = await response.text();
  if (!text) return { error: `The server returned an empty response (${response.status}).` };
  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return { error: `The server returned an unexpected response (${response.status}). Check the server log.` };
  }
}
