import React from "react";
import { initializeWidget, useDatasheet } from "@vikadata/widget-sdk";
import { Wrong } from "./wrong";
import { ExcelImport } from "./excel_import";

export const HelloWorld: React.FC = () => {
  const datasheet = useDatasheet();
  const permission = datasheet?.checkPermissionsForAddRecord();

  return (
    <div
      style={{
        display: "flex",
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      {permission?.acceptable ? (
        <ExcelImport />
      ) : (
        <Wrong description="维格表权限为只读，无法进行写入操作" />
      )}
    </div>
  );
};

initializeWidget(HelloWorld, process.env.WIDGET_PACKAGE_ID);
