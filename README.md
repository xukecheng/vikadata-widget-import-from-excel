# 维格小程序 - 从 Excel 导入

可以从 .xlsx .csv .xls 文件追加导入更多数据

## 📄 使用指南

导入文件的首列标题需要和被导入的维格表内的列标题一致，示例如下：
![vika_field.png](https://oss.xukecheng.tech/image/png/1646017424.png)
![excel_field.png](https://oss.xukecheng.tech/image/png/1646709258.png)

模板示例：https://vika.cn/share/shrzWKKTvijSdqyE0EAlB/fodFCh1bgBuhe

需要注意的是：
- 不支持导入计算字段，“计算字段”的意思是，不允许用户主动写入值的字段类型。（比如：自增数字、公式、神奇引用、修改时间、创建时间、修改人、创建人）
- 不支持导入附件、成员、神奇关联字段
- 由于 SDK 的限制，单多选暂时不支持导入新选项（PS：导入多选列时，多个选项需要用 "," 符号分隔）
- 导入的文件里如果含有日期字段，格式需要为：YYYY-MM-DD hh:mm:ss 
- 不可在仪表盘使用

## 🎯 更新日志

- v0.1.4 - 2022年3月14日 优化百分比字段的导入
- v0.1.2 - 2022年3月10日 增加大数量下导入的提示 && 针对大数据下的导入进行初步优化
- v0.0.2 - 2022年3月9日：改进报错提醒 && 兼容货币符号的导入 && 针对大数据下的导入进行初步优化
- v0.0.1 - 2022年2月28日：发布首个版本

## 🌈 动手党的天堂

如果你是一名编程人员或者是对开发维格小程序感兴趣的爱好者，欢迎访问GitHub的项目库，👉 [Github-widget-import-from-excel](https://github.com/xukecheng/widget-import-from-excel)。

如果你在开发小程序的过程中遇到阻碍，希望得到更多的帮助与启发，或者想要学习一下其他开发者的作品，欢迎访问维格官方的项目宝藏库，👉 [Github：awesome-vikadata](https://github.com/vikadata/awesome-vikadata)。

PS：如果你也有关于维格表小程序的项目开源，欢迎给我们提交PR，我们会将优秀作品收录到官方宝藏库，独乐乐不如众乐乐😍😍😍

