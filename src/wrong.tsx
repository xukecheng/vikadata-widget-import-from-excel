import React from "react";
import { Button } from "@vikadata/components";

interface Props {
  description?: any;
}

export const Wrong: React.FC<Props> = (props) => {
  const { description } = props;
  return (
    <div>
      <Button variant="jelly" color="primary" size="middle" disabled>
        {description}
      </Button>
      <div
        style={{
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "12px",
          color: "#7b67ee",
          cursor: "pointer",
        }}
        onClick={() => {
          window.open("https://bbs.vika.cn/article/144", "_blank");
        }}
      >
        查看教程
      </div>
    </div>
  );
};
