import { randomUUID } from "node:crypto";
import { isSameOrigin } from "@/lib/request";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const fileTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxFileSize = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const photo = formData?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return Response.json({ error: "Choose an image to upload" }, { status: 422 });
  const extension = fileTypes.get(photo.type);
  if (!extension) return Response.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 422 });
  if (photo.size > maxFileSize) return Response.json({ error: "The image must be 4 MB or smaller" }, { status: 422 });

  const path = `${user.id}/${randomUUID()}.${extension}`;
  const service = createServiceClient();
  const { error } = await service.storage.from("employee-photos").upload(path, new Uint8Array(await photo.arrayBuffer()), {
    contentType: photo.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[employee-photo] upload failed", JSON.stringify({ message: error.message, name: error.name }));
    return Response.json({ error: "Unable to upload photo. Check the Supabase Storage migration." }, { status: 500 });
  }

  const { data } = service.storage.from("employee-photos").getPublicUrl(path);
  return Response.json({ url: data.publicUrl }, { status: 201 });
}
