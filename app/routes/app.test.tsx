import { Card, Page, Text } from "@shopify/polaris";
import React from "react";

type Props = {};

const AppTest = (props: Props) => {
  return (
    <Page>
      <Card>
        <Text as={"h1"}>Testing</Text>
      </Card>
    </Page>
  );
};

export default AppTest;
