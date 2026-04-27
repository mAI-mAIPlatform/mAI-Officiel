import "server-only";
import { createHash } from "node:crypto";
import type { PlanKey } from "@/lib/subscription";

const ACTIVATION_HASH_PEPPER = "mAI::subscription::v095::server-only";
const OFFICIAL_CODES_BY_PLAN: Record<PlanKey, string[]> = {
  free: [],
  plus: [],
  pro: [],
  max: [],
};

const PLUS_CODE_HASHES = new Set([
  "f42a60f142a9d0130e234d44d65e58d9a7c8070b86dabaa0734211a1c4a31b42",
  "af4bfc27073e09f75125f29def5606894b6091468d0f7eb50cbb32cb79ef88a1",
  "1803b2805d5caaed37bc6f870b81200e363a1974057382bc4be9b7b928ca50f2",
  "34b2e9d51ee0cfb33e20e12b76281463b6de6166d0615f810cefa7071524a933",
  "e270ae7a7b953e08604ba141df0bb497386cd9980e9c1c1bdc8f39a958f6146c",
  "889605190083cd9c83e5054242fbcd4ebf40b586802ba0d3a62723271df8f1ef",
  "6a3dfd69ae2a85470711fd5bbe70cdcdd4549bab61121e1b986fd407874d27d2",
  "810c227fed8ea5de148faf277dd874c60eb9d525e31f18292273aa80d56073f4",
  "c55c7c0823ed24d909e5e23a016f67174f8bfd6f0f588b3e63d5f99e1e6997cb",
  "cf2f2a2d715acde6932b2683dbeb78d631cbe1c9db79565f6cae7a25b0f144e8",
  "f6cc7112a7346a647ae4228a97104ce0981ee2f1c230328ce22460ea5669fcdc",
  "ba1a3543e9ed820ee5d96cbbc54909f6f3c29133c37ec7d7de2edbb3abdcd945",
  "dd6b271a7710de6f4e7f1085729d3e6c8010a09a1ebaebfea15a733ef21c5d52",
  "f45e89b98c428cfd561bc0e6ca881584b2e485e8512720263c0f4492011e8b80",
  "c484f8b0350d88810c7c48771d11e4f6ef1a842033dbf86bb6c3a1f285cf5a21",
  "530f33fed2ba1c1b43e46939588ebb387edfceca30ac9d4a8600740c09b93f6b",
  "3d92997c3a569544440d18524a13f24e506c5d0b3b724acee57d7f231b557709",
  "9aad1333851f51955e31c60637fea7494d1bdbcce64c50b1980047163a0b9cad",
  "d0b8b0c0ed6b5e71c42f88d3a0b63f489c81f685c34dfd71d24c54a1a3c03185",
  "e6c13cad21afbfa7ed027be9de21c4ee63192b40fcdc9a71a77364670bad4aeb",
]);

const PRO_CODE_HASHES = new Set([
  "671a75327df66737d1707a8b6da3b42b4ae8c7650a09cd6d8b1e40c696deff17",
  "0253fd126d5a20cb1cd0b4fdbd36e852b5d3c126aeee32d6d111ce5318023742",
  "16b48a22cccd0d23ac96b13c8c94bd60e7b80d9ea8cc99d8bcccd7d7e4aa0f50",
  "01142dfed8ebaa3009c225f01295d5ba507b76ffbf43489cf66bbf6a119a87e8",
  "c882c4e1fb2a559db7c528ab5d1706a57a7b2b742ba99536bc2aded16464b518",
  "4f5ff42737d59042030b0c74af2a4e4a92d007825a33f0f08f9688f9bfda37d6",
  "ccb979b46f1dec933f63cdc08d01ff36e4c7fee610979ef0ce0681c682e90da5",
  "300c3b74ed3778fbe57d9c3732a92cdf486ba4e4d4e2a1a2195f0e959cb4db5d",
  "bae5990e45ac1f81e14b47b647315409521521024f4fb6111bdd64497735fe2e",
  "bb52f213d2764ce790b63304731b662094a19b20ee8ce2a582572af4196914b0",
  "a9b9d62ca26e778d5413b446ffb1e6be41201cbe201e22d7c0ee2427728aa5ec",
  "1983ca03f31e9b81dbbf4762119877dab3519e880ea693f180c776519b1e72ba",
  "2a54c1553993b013b84d46fb4a2cf58d808be344a1bda0c1ca959c8bc4dbef23",
  "a5af55bdb62b217561fa747cedf2a4dc97ffc1c591704a0595702ca204eb5fd5",
  "e7f81413328278bdcba2342d9c5cc2e9843fdd69e917968bb1ffeadb9aa9b4ce",
  "08cdb265dbda25225381fa9c10ba139f4fb0bf18c786dc0ffbcdbf8d9614009c",
  "927fa1488bdd24988052901fcfffa20240a34726d3b39f8e61e0b5ca0f231624",
  "77cd345d2fa2225ba4a994bd539a8720799cf31505e39a299856fd4ccfab0aea",
  "3328c74680464c70e433efd062bbb987fc1532117cb86b063f5096732e608f8d",
]);

const MAX_CODE_HASHES = new Set([
  "2e85dc46f0439cba552f87bfa79d863d00e3a4d818d94d8c7ae497c8de0e0f1f",
  "ac5c69a121f9eccdf1e008b822b0fe8ef0c4bbb690db1ee0e111729f5fc65c01",
  "cf9dba2665d8aa2b4b465282176bbb3392de7f50e27a24f2502d3ff43c2d9b72",
  "6568362d2e4a8e83c1a7be99c86853636adfad1df535c2bce287f9f4251b60fb",
  "d4d2d1c2c7db37b04ca267374fa7ce19fd8a509356bb9b28ccb0e6057d7643cc",
  "01781a3f6efa81badb32bc496b9960056b5cd6b1fe525109aa51bc1ae9e3bff4",
  "ce1a9ac8ca5f30a7228548207c011991636eaffd104060a18d6bd5657093a3f8",
  "611a5c05634598dc2216b98794b8d9fd00f21cc1374b27741a7c3766da346d85",
  "d016329028fc581c2edbd9c92527eef81b40abcff42fb5aaa79966d788c11954",
  "d13655c69e6246facb21873a5c271d86a2167a5c104377c9426812d641c449da",
  "621e9516aa5afc9de04b24ac95a3fb54fad04794802c0a0a89bea4bcff9fb21a",
  "28fb5e18e22aa5263714eaafaf088e419a1f5ed1ca882a17bfcbf2f662647d04",
  "4016668722667be9bab0cd9354590ed64574823679691fb53d02cae6ab511256",
  "32ba22d373edf7ac8c37c187b3b6e8f31c2ba27b0119d81170324990b6444f66",
  "15bab0be96b7746523c1653e7a1c5971399b617056376f09859850232f3e599e",
  "fbab0571d67457e15670734ab03cedc791728584e96bce0bbf8756db5cd72e18",
  "a69b74b2826d9c4892838b1cf074c29825220cbb8a7e5f74635b160d814a5b84",
  "5ffe09bfc54ddacbc0a350c4a3c933e33dc2294f94b376b38cd6db604584a909",
  "3ee5af89fadd39ff56501364bbd94d1e919693b3d6caa09ce4aa850b9a7c625e",
  "d34e1eeef119b2728647c9d309c2a0e09b4a72bdae3085b7f5f12329f821c868",
]);

function hashActivationCode(code: string): string {
  return createHash("sha256")
    .update(`${ACTIVATION_HASH_PEPPER}${code}`)
    .digest("hex");
}

export function getPlanFromActivationCode(code: string): PlanKey | null {
  const raw = code.trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.toUpperCase();
  const compact = normalized.replace(/[\s-]+/g, "");

  for (const [plan, planCodes] of Object.entries(OFFICIAL_CODES_BY_PLAN) as Array<
    [PlanKey, string[]]
  >) {
    if (planCodes.includes(compact)) {
      return plan;
    }
  }

  const hashCandidates = [
    hashActivationCode(raw),
    hashActivationCode(normalized),
    hashActivationCode(compact),
  ];

  for (const hashedCode of hashCandidates) {
    if (PLUS_CODE_HASHES.has(hashedCode)) {
      return "plus";
    }
    if (PRO_CODE_HASHES.has(hashedCode)) {
      return "pro";
    }
    if (MAX_CODE_HASHES.has(hashedCode)) {
      return "max";
    }
  }

  return null;
}
