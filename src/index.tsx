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

  function addRecords(records: any[]) {
    var chunk = function (arr: any[], num: number) {
      num = num * 1 || 1;
      var ret: any[] = [];
      arr.forEach(function (item, i) {
        if (i % num === 0) {
          ret.push([]);
        }
        ret[ret.length - 1].push(item);
      });
      console.log(ret);
      return ret;
    };
    if (!datasheet) {
      return;
    }
    const permission = datasheet.checkPermissionsForAddRecord(records);
    if (permission.acceptable) {
      console.log(records.length);
      // try {
      //   datasheet.addRecords(records);
      // } catch (error) {
      //   alert(error);
      // }
      // TODO: 解决大量数据的导入问题
      if (records.length > 2000) {
        chunk(records, 1000).forEach((recordList, index) => {
          setTimeout(async () => {
            console.log("插入1000条-" + index);
            datasheet.addRecords(recordList);
          }, index * 5500);
        });
        setTimeout(async () => {
          console.log("完成大量数据导入");
          setProgressState(false);
        }, (records.length / 1000) * 5500);
      } else {
        datasheet.addRecords(records).then((value) => setProgressState(false));
      }
      return;
    } else {
      alert(permission.message);
      setProgressState(false);
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
      console.log("文件中含有错误的日期数据", excelDate);
      return null;
    }
  }
  //文件选择
  function selectFile() {
    fileInput.current?.click();
  }
  const onImportExcel = (file) => {
    const mention = confirm(
      "请注意：当前仅支持追加导入；导入文件的列名需与维格表内的完全一致；不支持计算字段、成员字段、附件字段和神奇关联字段的导入"
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

          const newData: any[] = data.filter(function (s: any[]) {
            return s.length != 0 && s;
          });
          const newDataNum = newData.length;

          let bigDataWarning: Boolean =
            newDataNum > 10000
              ? confirm(
                  "请注意：当前导入的数据量较大，同步过程中容易导致维格表出现卡顿、同步慢等情况，情况程度视设备及网络情况而定"
                )
              : true;

          if (bigDataWarning) {
            // 定义数据处理方式
            const handleDateTimeType = (data: any) => format(data);
            const handleCheckboxType = (data: any) =>
              data === 1 || data === true ? true : false;
            const handleMultiSelectType = () => String(data).split(",");
            const handleCurrencyType = (data: any) => {
              // 避免源数据中含有货币符号
              return typeof data != "number"
                ? Number(data.match(/-?[0-9]+(.[0-9]+)?/)[0])
                : data;
            };
            const handlePercentType = (data: any) => {
              // 百分比类型字段处理
              return typeof data === "number"
                ? data
                : data.match("%")
                ? Number(data.match(/-?[0-9]+(.[0-9]+)?/)[0])
                : Number(data.match(/-?[0-9]+(.[0-9]+)?/)[0]) * 100;
            };
            const handleNumberType = (data: any) => {
              // 数字类型字段处理
              return typeof data === "number"
                ? data
                : Number(data.match(/-?[0-9]+(.[0-9]+)?/)[0]);
            };

            // 定义数据处理映射
            let fieldHandle = {
              DateTime: handleDateTimeType,
              Number: handleNumberType,
              Checkbox: handleCheckboxType,
              MultiSelect: handleMultiSelectType,
              Currency: handleCurrencyType,
              Percent: handlePercentType,
              Rating: handleNumberType,
            };

            newData.forEach((record: any[]) => {
              const valuesMap = new Object();

              fields.map((field) => {
                const specialType = ["Attachment", "Member", "MagicLink"];

                if (field.isComputed || specialType.includes(field.type))
                  return;

                // 找出维格表每个字段在导入的文件里是什么位置
                const index: number = header.indexOf(field.name);

                if (index === -1) return;
                try {
                  let handleType = fieldHandle[field.type];
                  var parseData = !String(record[index])
                    ? null
                    : field.type in fieldHandle
                    ? handleType(record[index])
                    : String(record[index]);
                  if (typeof parseData === "number" && isNaN(parseData)) {
                    parseData = null;
                  }
                  valuesMap[field.id] = parseData;
                } catch (error) {
                  valuesMap[field.id] = null;
                }
              });
              records.push({ valuesMap });
            });
            // console.log(records);
            addRecords(records);
          } else {
            setProgressState(false);
            return;
          }
        } catch (e) {
          console.log(e);
          alert(e);
          setProgressState(false);
          return;
        }
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
          <div
            style={{
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
      )}
    </div>
  );
};

initializeWidget(HelloWorld, process.env.WIDGET_PACKAGE_ID);
