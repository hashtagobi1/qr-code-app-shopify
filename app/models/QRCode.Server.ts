import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";

export interface QRCodeType {
  id?: number;
  title?: string;
  shop?: string;
  productId?: string;
  productHandle?: string;
  productVariantId?: string;
  destination?: string;
  scans?: number;
  createdAt?: Date;
}

export async function getQRCode(id: number, graphql: any) {
  const qrCode: QRCodeType | null = await db.qRCode.findFirst({
    where: { id },
  });

  if (!qrCode) {
    return null;
  }

  return supplementQRCode(qrCode, graphql);
}

export async function getQRCodes(shop: any, graphql: any) {
  const qrCodes: QRCodeType[] | null = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCode) => supplementQRCode(qrCode, graphql))
  );
}

export function getQRCodeImage(id: any) {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
  console.log({ url });
  return qrcode.toDataURL(url.href);
}

export function getDestinationUrl(qrCode: any) {
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(
    qrCode.productVariantId
  );
  invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

async function supplementQRCode(qrCode: any, graphql: any) {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id);
  const response = await graphql(
    `
      #graphql
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: qrCode.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  console.log({ qrCode, graphql });

  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    destinationUrl: getDestinationUrl(qrCode),
    image: await qrCodeImagePromise,
  };
}

export function validateQRCode(data: any) {
  interface Errors {
    title?: string;
    productId?: string;
    destination?: string;
  }
  const errors: Errors = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }
  if (!data.destination) {
    errors.destination = "Destination is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
