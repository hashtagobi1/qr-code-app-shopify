import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getDestinationUrl } from "~/models/QRCode.Server";
import db from "../db.server";

export async function loader(args: LoaderFunctionArgs) {
  invariant(args.params.id, "Could not find QR Code Destination");

  const id = Number(args.params.id);
  const qrCode = await db.qRCode.findFirst({ where: { id } });

  invariant(qrCode, "Could not find QR Code Destination");

  await db.qRCode.update({
    where: { id },
    data: {
      scans: {
        increment: 1,
      },
    },
  });

  return redirect(await getDestinationUrl(qrCode));
}
