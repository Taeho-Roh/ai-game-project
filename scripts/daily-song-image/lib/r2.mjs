// Cloudflare R2 업로드 — S3 호환 API 를 의존성 없이 직접 서명(AWS SigV4)해서 PUT 해요.
// 인터페이스: { putObject(key, body, contentType), publicUrl(key) }. 다른 S3 호환 저장소로 바꿔 끼울 수 있어요.
// 필요한 환경변수: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
import crypto from "node:crypto";

export const R2_ENV = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];

export function missingR2Env(env = process.env) {
  return R2_ENV.filter((k) => !env[k]);
}

const sha256hex = (data) => crypto.createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
const encodeKey = (key) => key.split("/").map((seg) => encodeURIComponent(seg)).join("/");

/** SigV4 서명 헤더를 만들어요 (시간을 넣을 수 있어 테스트 가능) */
export function signPut({ host, bucket, key, body, contentType, accessKeyId, secretAccessKey, region = "auto", now = new Date() }) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20260101T000000Z
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256hex(body);
  const canonicalUri = `/${bucket}/${encodeKey(key)}`;
  const headers = { "content-type": contentType, host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((n) => `${n}:${headers[n]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, date), region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return {
    url: `https://${host}${canonicalUri}`,
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

export function createR2Client({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const missing = missingR2Env(env);
  if (missing.length) throw new Error(`R2 환경변수가 없어요: ${missing.join(", ")}`);
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  return {
    bucket: env.R2_BUCKET,
    /** 올린 파일을 사람이 볼 공개 주소 */
    publicUrl: (key) => `${base}/${key}`,
    async putObject(key, body, contentType = "image/png") {
      const { url, headers } = signPut({
        host,
        bucket: env.R2_BUCKET,
        key,
        body,
        contentType,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      });
      const res = await fetchImpl(url, { method: "PUT", headers, body });
      if (!res.ok) throw new Error(`R2 업로드 실패 ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { key, url: `${base}/${key}` };
    },
  };
}
