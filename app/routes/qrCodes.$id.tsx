import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getQRCodeImage } from "~/models/QRCode.Server";
import db from "../db.server";

export async function loader(args: LoaderFunctionArgs) {
  invariant(args.params.id, "Could not find QR Code Destination");

  const id = Number(args.params.id);
  const qrCode = await db.qRCode.findFirst({ where: { id } });

  invariant(qrCode, "Could not find QR Code Destination");

  return json({
    title: qrCode.title,
    image: await getQRCodeImage(id),
  });
}

export default function QRCode() {
  const { title, image } = useLoaderData<typeof loader>();
  return (
    <>
      <h1>{title}</h1>
      <img src={image} alt="QR Code for product" />
    </>
  );
}
