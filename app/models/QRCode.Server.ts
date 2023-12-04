import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";

export async function getQRCode(id: number, graphql: any) {
  console.log(graphql);
  const qrCode = await db.qRCode.findFirst({ where: { id } });

  if (!qrCode) return null;

  return supplementQRCode(qrCode, graphql);
}

export async function getQRCodes(shop: any, graphql: any) {
  const qrCodes = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCode) => supplementQRCode(qrCode, graphql))
  );
}

export function getQRCodeImage(id: number) {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL);
  return qrcode.toDataURL(url.href);
}

export async function getDestinationURL(qrCode: any) {
  console.log({ qrCode });
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(
    qrCode.productVariantId
  );
  invariant(match, "Unrecognized Product Variant ID");
  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

async function supplementQRCode(qrCode: any, graphql: any) {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id);
  const response = await graphql(
    `
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            modes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: qrCode.productID,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();
  console.log(product);

  return {
    ...qrCode,
    productDeleted: !product?.title,
    producttitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    destinationUrl: getDestinationURL(qrCode),
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
