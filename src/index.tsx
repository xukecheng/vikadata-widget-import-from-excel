import React, { useState } from "react";
import {
  initializeWidget,
  useDatasheet,
  useActiveViewId,
  useFields,
} from "@vikadata/widget-sdk";
import * as XLSX from "xlsx";
import { Loading, Button } from "@vikadata/components";

export const HelloWorld: React.FC = () => {
  const viewId = useActiveViewId();
  const datasheet = useDatasheet();
  const fields = useFields(viewId);
  const [progressState, setProgressState] = useState<boolean>(false);
  const fileInput = React.createRef<HTMLInputElement>();

  async function addRecords(records) {
    // var chunk = function (arr: any[], num: number) {
    //   num = num * 1 || 1;
    //   var ret: any[] = [];
    //   arr.forEach(function (item, i) {
    //     if (i % num === 0) {
    //       ret.push([]);
    //     }
    //     ret[ret.length - 1].push(item);
    //   });
    //   console.log(ret);
    //   return ret;
    // };
    if (!datasheet) {
      return;
    }
    const permission = datasheet.checkPermissionsForAddRecord(records);
    if (permission.acceptable) {
      console.log(records.length);
      try {
        datasheet.addRecords(records);
      } catch (error) {
        alert(error);
      }
      // TODO: 解决大量数据的导入问题
      // if (records.length > 5000) {
      //   chunk(records, 5000).forEach(async (recordList, index) => {
      //     // setTimeout(() => {
      //     //   console.log("插入5000条-" + index);
      //     //   datasheet.addRecords(recordList);
      //     // }, index * 100);
      //     await sleep(500);
      //     console.log("插入5000条-" + index);
      //     datasheet.addRecords(recordList);
      //   });
      // } else {
      //   datasheet.addRecords(records);
      // }
      return;
    }
  }

  // 自定义格式化日期
  function format(excelDate: any) {
    if (typeof excelDate === "number") {
      let step = new Date().getTimezoneOffset() <= 0 ? 25567 + 2 : 25567 + 1;
      let utc_days = Math.floor(excelDate - step);
      // 86400 => 24 * 60 * 60 => 一天的总秒数
      let utc_value = utc_days * 86400;
      // 一天的总毫秒数
      let date_info = new Date(utc_value * 1000);

      // 误差处理
      let fractional_day = excelDate - Math.floor(excelDate) + 0.0000001;
      // 自 1970 年至今的总秒数
      let total_seconds = Math.floor(86400 * fractional_day);

      let seconds = total_seconds % 60;

      total_seconds -= seconds;

      let hours = Math.floor(total_seconds / (60 * 60));
      let minutes = Math.floor(total_seconds / 60) % 60;

      return new Date(
        date_info.getFullYear(),
        date_info.getMonth(),
        date_info.getDate(),
        hours,
        minutes,
        seconds
      ).getTime();
    } else if (typeof excelDate === "string") {
      // 字符串需要是 2001/10/01 10:11:01
      excelDate = excelDate.substring(0, 19);
      // 必须把日期'-'转为'/'
      excelDate = excelDate.replace(/-/g, "/");
      const timestamp = new Date(excelDate).getTime();
      return timestamp;
    } else {
      alert("文件中含有错误的日期数据");
      return null;
    }
  }
  //文件选择
  function selectFile() {
    fileInput.current?.click();
  }
  const onImportExcel = (file) => {
    const mention = confirm(
      "请注意：导入文件的列名需与维格表内的完全一致；不支持计算字段、成员字段、附件字段的导入"
    );

    // 获取上传的文件对象
    const { files } = file.target;

    // 通过FileReader对象读取文件
    const fileReader = new FileReader();

    // 以二进制方式打开文件
    fileReader.readAsBinaryString(files[0]);
    if (mention) {
      setProgressState(true);
      fileReader.onload = (event) => {
        try {
          const target = event.target?.result;
          // 以二进制流方式读取得到整份excel表格对象
          const wb = XLSX.read(target, {
            type: "binary",
            cellText: false,
            cellDates: false,
          });
          // 默认只读取第一张表;
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          // 利用 sheet_to_json 方法将 excel 转成 json 数据
          const data: any[] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            raw: true,
          });

          const records: Object[] = [];
          const header: any[] = data[0];
          const fieldNames: any[] = fields.map((field) => field.name);
          const intersection = fieldNames.filter(function (fieldName) {
            return header.indexOf(fieldName) > -1;
          });

          if (intersection.length === 0) {
            alert("导入文件中没有和当前表格相同的列");
            setProgressState(false);
            return;
          }

          console.log("有交集的字段：", intersection);
          console.log("导入文件的字段：", header);

          data.shift();
          // console.log("导入文件的原始数据：", data);

          data.forEach((record: any) => {
            const valuesMap = new Object();
            fields.map((field) => {
              // 找出维格表每个字段在导入的文件里是什么位置
              const index: number = header.indexOf(field.name);
              if (index != -1) {
                if (field.isComputed) {
                  // 计算字段处理
                  console.log("计算字段不能写入：", [field.name, field.id]);
                } else if (
                  field.type === "Attachment" ||
                  field.type === "Member" ||
                  field.type === "MagicLink"
                ) {
                  // 附件和成员类型字段处理
                  console.log("特殊字段不能写入：", [field.name, field.id]);
                } else if (field.type === "DateTime") {
                  // 日期类型字段处理
                  valuesMap[field.id] = format(record[index]);
                } else if (field.type === "Number") {
                  // 数字类型字段处理
                  try {
                    valuesMap[field.id] = parseInt(record[index]);
                  } catch (error) {
                    valuesMap[field.id] = null;
                  }
                } else if (field.type === "Checkbox") {
                  // 勾选类型字段处理
                  valuesMap[field.id] =
                    record[index] === 1 || record[index] === true
                      ? true
                      : false;
                } else if (field.type === "MultiSelect") {
                  // 多选类型字段处理
                  // console.log("MultiSelect", String(record[index]).split(","));
                  valuesMap[field.id] = String(record[index]).split(",");
                } else if (!record[index]) {
                  // 如果原始数据为空，则写入 null
                  valuesMap[field.id] = null;
                } else {
                  // 默认存储字符串
                  valuesMap[field.id] = String(record[index]);
                }
              }
            });
            records.push({ valuesMap });
          });
          console.log(records);
          addRecords(records);
        } catch (e) {
          console.log("文件类型不正确", e);
          alert("文件类型不正确");
          setProgressState(false);
          return;
        }
        setProgressState(false);
      };
    }

    // 清空选择的文件
    fileReader.onloadend = (event) => {
      if (fileInput.current) {
        fileInput.current.value = "";
      }
    };
  };
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
      {progressState ? (
        <Loading />
      ) : (
        <div>
          <div role="upload" onClick={selectFile}>
            <input
              type="file"
              ref={fileInput}
              accept=".xlsx, .xls, .csv"
              style={{ display: "none" }}
              id="inputfile"
              onChange={onImportExcel}
            />
            <Button color="primary">点击开始导入文件</Button>
          </div>
          <p
            style={{
              paddingTop: "10px",
              fontSize: "12px",
              textAlign: "center",
              color: "GrayText",
            }}
          >
            仅支持 .xlsx .xls .csv
          </p>
        </div>
      )}
    </div>
  );
};

initializeWidget(HelloWorld, process.env.WIDGET_PACKAGE_ID);
