/* 由 tools/convert-banks.mjs 生成，请勿手改；改题库请改 ref/题库/Web题库.md 后重跑脚本 */
window.WEB_BANK = {
  "key": "web",
  "title": "Web前端题库",
  "source": "ref/题库/Web题库.md",
  "chapters": [
    {
      "no": 1,
      "title": "HTML基础",
      "count": 25
    },
    {
      "no": 2,
      "title": "HTML进阶",
      "count": 15
    },
    {
      "no": 3,
      "title": "HTML表单与表格",
      "count": 11
    },
    {
      "no": 4,
      "title": "CSS",
      "count": 25
    },
    {
      "no": 5,
      "title": "JavaScript基础",
      "count": 26
    },
    {
      "no": 6,
      "title": "JavaScript进阶",
      "count": 18
    }
  ],
  "questions": [
    {
      "id": 1,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下面选项中，用于为页面添加视频的标签是（）。",
      "options": [
        {
          "key": "A",
          "text": "audio"
        },
        {
          "key": "B",
          "text": "video"
        },
        {
          "key": "C",
          "text": "text"
        },
        {
          "key": "D",
          "text": "image"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在 HTML5 中，`<video>` 标签用于在页面中嵌入视频内容，而 `<audio>` 用于音频。"
    },
    {
      "id": 2,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下列选项中，用来设置一行内容的垂直对齐方式的是（）。",
      "options": [
        {
          "key": "A",
          "text": "height"
        },
        {
          "key": "B",
          "text": "align"
        },
        {
          "key": "C",
          "text": "valign"
        },
        {
          "key": "D",
          "text": "background"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "在HTML中，valign属性用于设置表格单元格中内容的垂直对齐方式，可选值有top、middle、bottom等。height设置高度，align设置水平对齐，background设置背景，因此正确答案是C。"
    },
    {
      "id": 3,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "Web标准的制定者是?()",
      "options": [
        {
          "key": "A",
          "text": "以上都不是"
        },
        {
          "key": "B",
          "text": "微软(Microsoft)"
        },
        {
          "key": "C",
          "text": "网景公司(Netscape)"
        },
        {
          "key": "D",
          "text": "万维网联盟(W3C)"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "Web标准由万维网联盟（W3C）制定，W3C致力于开发Web技术规范。微软和网景公司是浏览器厂商，曾主导浏览器市场，但并非标准制定者。因此正确答案是D。"
    },
    {
      "id": 4,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下面选项中，有哪些浏览器是基于Trident内核的()。",
      "options": [
        {
          "key": "A",
          "text": "谷歌浏览器"
        },
        {
          "key": "B",
          "text": "火狐浏览器"
        },
        {
          "key": "C",
          "text": "欧朋浏览器"
        },
        {
          "key": "D",
          "text": "IE浏览器"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "Trident内核由微软开发，主要用于IE浏览器。谷歌浏览器使用Blink内核，火狐浏览器使用Gecko内核，欧朋浏览器早期使用Presto内核，现也使用Blink内核。因此只有IE浏览器基于Trident内核。"
    },
    {
      "id": 5,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "在下列的HTML中，哪个可以产生超链接?()",
      "options": [
        {
          "key": "A",
          "text": "`<a url=\"http://www.w3school.com.cn\">W3School.com.cn</a>`"
        },
        {
          "key": "B",
          "text": "`<a href=\"http://www.w3school.com.cn\">W3School</a>`"
        },
        {
          "key": "C",
          "text": "`<a>http://www.w3school.com.cn</a>`"
        },
        {
          "key": "D",
          "text": "`<a name=\"http://www.w3school.com.cn\">W3School.com.cn</a>`"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "超链接使用`<a>`标签的href属性指定链接目标。选项B正确使用了href属性。选项A使用了错误的url属性；选项C缺少href属性；选项D的name属性用于定义锚点，不产生超链接。"
    },
    {
      "id": 6,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "以下哪个是HTML中的内联(行内)元素？",
      "options": [
        {
          "key": "A",
          "text": "`<span>`"
        },
        {
          "key": "B",
          "text": "`<div>`"
        },
        {
          "key": "C",
          "text": "`<p>`"
        },
        {
          "key": "D",
          "text": "`<h1>`"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "内联元素不会独占一行，常见的有 `<span>`、`<a>`、`<img>` 等；`<div>`、`<p>`、`<h1>` 是块级元素。"
    },
    {
      "id": 7,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "在下列的HTML中，哪个可以插入换行?()",
      "options": [
        {
          "key": "A",
          "text": "`<br/>`"
        },
        {
          "key": "B",
          "text": "`<break>`"
        },
        {
          "key": "C",
          "text": "`<lb/>`"
        },
        {
          "key": "D",
          "text": "以上都不是"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，`<br>`或`<br/>`用于插入换行，是标准标签。`<break>`和`<lb/>`不是有效HTML标签，因此正确答案是A。"
    },
    {
      "id": 8,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "在下列的HTML中，哪个是字号最大的标题?()",
      "options": [
        {
          "key": "A",
          "text": "`<heading>`"
        },
        {
          "key": "B",
          "text": "`<head>`"
        },
        {
          "key": "C",
          "text": "`<h1>`"
        },
        {
          "key": "D",
          "text": "`<h6>`"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "在HTML中，标题标签从`<h1>`到`<h6>`，字号依次减小，`<h1>`是最大的标题。`<heading>`和`<head>`不是标题标签，`<head>`用于定义文档头部信息。"
    },
    {
      "id": 9,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下列标签中，用于定义HTML5文档所要显示内容的是()。",
      "options": [
        {
          "key": "A",
          "text": "`<body></body>`"
        },
        {
          "key": "B",
          "text": "`<html></html>`"
        },
        {
          "key": "C",
          "text": "`<head></head>`"
        },
        {
          "key": "D",
          "text": "`<title></title>`"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML5文档中，`<body>`标签用于定义文档的主体内容，即浏览器中显示的所有可见内容。`<html>`是根标签，`<head>`包含元数据，`<title>`定义标题，均不直接显示内容。因此正确答案是A。"
    },
    {
      "id": 10,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下列选项中属于单标签语法格式的是()。",
      "options": [
        {
          "key": "A",
          "text": "`<标签名>内容`"
        },
        {
          "key": "B",
          "text": "`<标签名/>`"
        },
        {
          "key": "C",
          "text": "`</标签名>`"
        },
        {
          "key": "D",
          "text": "`<标签名>`"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "单标签（自闭合标签）语法格式为`<标签名/>`，如`<br/>`。选项A是双标签的起始标签，选项C是结束标签，选项D缺少闭合斜杠，不符合XHTML规范。"
    },
    {
      "id": 11,
      "type": "single",
      "chapter": 1,
      "scorable": true,
      "stem": "下列属性中，用来设置单元格跨行合并的是（）。",
      "options": [
        {
          "key": "A",
          "text": "colspan"
        },
        {
          "key": "B",
          "text": "width"
        },
        {
          "key": "C",
          "text": "rowspan"
        },
        {
          "key": "D",
          "text": "bgcolor"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "colspan用于跨列合并，rowspan用于跨行合并。width设置宽度，bgcolor设置背景色。因此正确答案是C。"
    },
    {
      "id": 12,
      "type": "multiple",
      "chapter": 1,
      "scorable": true,
      "stem": "下列选项中的术语名词，属于网页术语的是( )",
      "options": [
        {
          "key": "A",
          "text": "WEB"
        },
        {
          "key": "B",
          "text": "IOS"
        },
        {
          "key": "C",
          "text": "HTTP"
        },
        {
          "key": "D",
          "text": "DNS"
        }
      ],
      "answer": [
        "A",
        "C",
        "D"
      ],
      "explanation": "WEB、HTTP、DNS都是与网页相关的术语。WEB指万维网，HTTP是超文本传输协议，DNS是域名系统，用于解析域名。IOS是苹果移动操作系统，与网页无关。"
    },
    {
      "id": 13,
      "type": "multiple",
      "chapter": 1,
      "scorable": true,
      "stem": "下列选项中，属于`<tr>`标签相关属性的是( )。",
      "options": [
        {
          "key": "A",
          "text": "background"
        },
        {
          "key": "B",
          "text": "right"
        },
        {
          "key": "C",
          "text": "align"
        },
        {
          "key": "D",
          "text": "height"
        }
      ],
      "answer": [
        "A",
        "C",
        "D"
      ],
      "explanation": "`<tr>`标签的HTML属性包括align（水平对齐）、background（背景图像）、height（高度）等，而right不是标准属性。因此A、C、D正确。"
    },
    {
      "id": 14,
      "type": "multiple",
      "chapter": 1,
      "scorable": true,
      "stem": "关于`<title>`标签的相关描述，下列说法正确的是( )。",
      "options": [
        {
          "key": "A",
          "text": "一个HTML文档只能包含一对`<title>`标签"
        },
        {
          "key": "B",
          "text": "`<title>`标签必须包含在`<head>`之内"
        },
        {
          "key": "C",
          "text": "`<title></title>`之间的内容将显示在浏览器窗口的标题栏中"
        },
        {
          "key": "D",
          "text": "`<title>`标签和`<head>`标签是并列关系"
        }
      ],
      "answer": [
        "A",
        "B",
        "C"
      ],
      "explanation": "一个HTML文档只能有一对`<title>`标签，且必须位于`<head>`标签内，其内容显示在浏览器标题栏。选项D错误，因为`<title>`是`<head>`的子元素，不是并列关系。"
    },
    {
      "id": 15,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在HTML中，form标签可以实现用户信息的收集和传递。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "form标签用于创建表单，包含输入控件，用户填写后通过提交按钮将数据发送到服务器，实现信息收集和传递。这是HTML表单的基本功能，表述正确。"
    },
    {
      "id": 16,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在表格中，有几对`<tr></tr>`，就表示该表格有几行。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML表格中，`<tr>`标签用于定义表格的行，每对`<tr></tr>`代表一行。因此，有几对`<tr></tr>`就表示表格有几行。这是表格结构的基本规则，没有歧义。"
    },
    {
      "id": 17,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在网页制作中，图片只能用GIF格式。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "网页制作中常用的图片格式包括GIF、JPEG、PNG、WebP等，GIF仅支持256色且不支持半透明，适用于简单动画或图标，但并非唯一格式。因此该说法错误。"
    },
    {
      "id": 18,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在超链接中，如果暂时没有确定链接目标，通常将`<a>`标签的href属性值定义为\"#\"。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，当超链接的href属性设置为\"#\"时，表示链接到当前页面的顶部，常用于占位符。这是一种常见做法，表示链接目标尚未确定，避免页面刷新或跳转。"
    },
    {
      "id": 19,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "设置标签属性时，标签名与属性、属性与属性之间均以逗号分开。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在HTML中，设置标签属性时，标签名与属性、属性与属性之间应以空格分隔，而非逗号。例如：`<img src=\"a.jpg\" alt=\"b\">`。使用逗号是错误的写法，这是初学者容易混淆的地方。"
    },
    {
      "id": 20,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "创建锚点链接包括创建链接文本和设置跳转目标位置两个步骤。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "创建锚点链接确实需要两个步骤：首先在目标位置设置锚点（如使用id属性），然后创建链接文本指向该锚点（如使用href=\"#id\"）。这是HTML中实现页面内跳转的标准方法。"
    },
    {
      "id": 21,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在标签嵌套结构中，双标签可以作为父级标签。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "双标签如`<div>`、`<p>`等可以包含其他标签，作为父级标签是HTML嵌套结构的基础。例如`<div><p>`文本`</p></div>`中`<div>`是父级。注意单标签如`<br>`不能作为父级。"
    },
    {
      "id": 22,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "标签就是放在\"< >\"标签符中表示某个功能的编码命令。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，标签通常由尖括号包围，如`<div>`，用于定义网页元素的功能或结构。题干描述符合标签的基本定义，因此正确。注意标签通常成对出现，但自闭合标签如`<br>`也符合此描述。"
    },
    {
      "id": 23,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在不同的浏览器中调用video标签时，视频的显示效果完全相同。（ ）",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "不同浏览器对视频格式的支持不同，且默认样式和控件可能有所差异，因此显示效果不一定相同。易错点：误以为所有浏览器统一标准。"
    },
    {
      "id": 24,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在表格中，cellpadding属性用于设置单元格内容与单元格边框之间的空白间距。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "cellpadding属性确实用于设置单元格内容与单元格边框之间的空白间距，这是HTML表格的基本属性。易错点：注意区分cellpadding（内边距）和cellspacing（单元格间距）。"
    },
    {
      "id": 25,
      "type": "judge",
      "chapter": 1,
      "scorable": true,
      "stem": "在`<audio>`和`</audio>`之间不能插入文字。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在`<audio>`和`</audio>`之间可以插入文字，这些文字会在浏览器不支持audio元素时显示，作为后备内容。因此，题干说法错误。"
    },
    {
      "id": 26,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "当图像不能显示时，可以用下列哪个属性设置其替换文本()。",
      "options": [
        {
          "key": "A",
          "text": "font"
        },
        {
          "key": "B",
          "text": "head"
        },
        {
          "key": "C",
          "text": "face"
        },
        {
          "key": "D",
          "text": "alt"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "在HTML中，`<img>`标签的alt属性用于指定图像的替换文本，当图像无法显示时，浏览器会显示该文本。其他选项如font、head、face均不是用于此目的。"
    },
    {
      "id": 27,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "关于定义有序列表的基本语法格式，下列书写正确的是()。",
      "options": [
        {
          "key": "A",
          "text": "`<ul> 列表项1 列表项2</ul>`"
        },
        {
          "key": "B",
          "text": "`<ul> <li>列表项1</li> <li>列表项2</li>……</ul>`"
        },
        {
          "key": "C",
          "text": "`<ol> <li>列表项1</li> <li>列表项2</li>……</ol>`"
        },
        {
          "key": "D",
          "text": "`<ol>列表项1</ol><ol>列表项2</ol>`"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "有序列表使用`<ol>`标签，列表项使用`<li>`标签。选项C正确。A和B使用`<ul>`是无序列表，D中每个列表项单独用`<ol>`错误。"
    },
    {
      "id": 28,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "在下列的HTML中，哪个可以插入图像?()",
      "options": [
        {
          "key": "A",
          "text": "`<img src=\"image.gif\"/>`"
        },
        {
          "key": "B",
          "text": "image.gif"
        },
        {
          "key": "C",
          "text": "`<img href=\"image.gif\"/>`"
        },
        {
          "key": "D",
          "text": "`<img>image.gif</img>`"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，插入图像使用`<img>`标签，其src属性指定图像文件的路径。选项A正确使用了src属性。选项B不是HTML标签。选项C错误使用了href属性（用于链接）。选项D的写法不符合`<img>`标签的语法，`<img>`是自闭合标签，不应包含内容。"
    },
    {
      "id": 29,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "下列属性中，用来设置单元格横跨列数的是()。",
      "options": [
        {
          "key": "A",
          "text": "colspan"
        },
        {
          "key": "B",
          "text": "bgcolor"
        },
        {
          "key": "C",
          "text": "width"
        },
        {
          "key": "D",
          "text": "rowspan"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "colspan属性用于设置单元格横跨的列数，即合并多列。rowspan用于合并行，bgcolor设置背景色，width设置宽度。因此正确答案是A。"
    },
    {
      "id": 30,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "要在HTML页面中直接引入外部CSS样式表，应使用的标签是（）",
      "options": [
        {
          "key": "A",
          "text": "`<script>`"
        },
        {
          "key": "B",
          "text": "`<link>`"
        },
        {
          "key": "C",
          "text": "`<style>`"
        },
        {
          "key": "D",
          "text": "`<import>`"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在HTML中，引入外部CSS样式表应使用`<link>`标签，通过href属性指定CSS文件路径。选项A的`<script>`用于引入JavaScript，选项C的`<style>`用于定义内部样式，选项D的`<import>`不是标准HTML标签。"
    },
    {
      "id": 31,
      "type": "single",
      "chapter": 2,
      "scorable": false,
      "stem": "在 CSS 中，用于设置元素**外边距**的属性是（　）",
      "options": [],
      "answer": null,
      "explanation": "CSS 中用 margin 设置外边距，padding 设置内边距，border 设置边框，outline 是轮廓线。"
    },
    {
      "id": 32,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "在定义列表中，用于对名词进行解释和描述的标签是 ()。",
      "options": [
        {
          "key": "A",
          "text": "`<dd></dd>`"
        },
        {
          "key": "B",
          "text": "`<li></li>`"
        },
        {
          "key": "C",
          "text": "`<dt></dt>`"
        },
        {
          "key": "D",
          "text": "`<dl></dl>`"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML定义列表（`<dl>`）中，`<dt>`用于定义术语/名词，`<dd>`用于描述/解释该术语。题目问的是“对名词进行解释和描述的标签”，因此正确答案是`<dd>`，对应选项A。易错点：混淆`<dt>`（名词）和`<dd>`（描述）。"
    },
    {
      "id": 33,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "下列选项中，可以设置文字字体的属性是()。",
      "options": [
        {
          "key": "A",
          "text": "color"
        },
        {
          "key": "B",
          "text": "font"
        },
        {
          "key": "C",
          "text": "size"
        },
        {
          "key": "D",
          "text": "face"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在CSS中，设置文字字体的属性是font-family，而font是复合属性，可以同时设置字体、大小、粗细等。color设置颜色，size不是CSS属性，face是HTML的font标签属性，已废弃。因此正确选项是B。"
    },
    {
      "id": 34,
      "type": "single",
      "chapter": 2,
      "scorable": true,
      "stem": "下面选项中，用于为页面添加音频的标签是()。",
      "options": [
        {
          "key": "A",
          "text": "image"
        },
        {
          "key": "B",
          "text": "video"
        },
        {
          "key": "C",
          "text": "audio"
        },
        {
          "key": "D",
          "text": "以上都不是"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "HTML5中，`<audio>`标签专门用于在页面中嵌入音频内容，支持MP3、WAV等格式。选项A的`<image>`是图片标签，选项B的`<video>`用于视频，因此正确答案是C。"
    },
    {
      "id": 35,
      "type": "multiple",
      "chapter": 2,
      "scorable": true,
      "stem": "下列选项中，属于表单标签`<form>`的属性是()。",
      "options": [
        {
          "key": "A",
          "text": "name"
        },
        {
          "key": "B",
          "text": "action"
        },
        {
          "key": "C",
          "text": "method"
        },
        {
          "key": "D",
          "text": "size"
        }
      ],
      "answer": [
        "A",
        "B",
        "C"
      ],
      "explanation": "表单标签`<form>`的常用属性包括name（表单名称）、action（提交地址）和method（提交方式，如get/post）。size属性通常用于`<input>`或`<select>`等元素，不属于`<form>`的属性。因此正确答案为A、B、C。"
    },
    {
      "id": 36,
      "type": "judge",
      "chapter": 2,
      "scorable": true,
      "stem": "一个HTML5文档可以包含多对`<head>`标签。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "一个HTML5文档只能包含一对`<head>`标签，用于定义文档的头部信息，如标题、样式、脚本等。包含多对`<head>`标签会导致文档结构错误，不符合HTML规范。"
    },
    {
      "id": 37,
      "type": "judge",
      "chapter": 2,
      "scorable": true,
      "stem": "有序列表是指有排列顺序的列表，其各个列表项按照一定的顺序排列。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "有序列表（`<ol>`）中的列表项（`<li>`）默认按数字顺序排列，且可通过type属性改变编号类型，因此题干描述正确。"
    },
    {
      "id": 38,
      "type": "judge",
      "chapter": 2,
      "scorable": true,
      "stem": "无序列表的各个列表项之间，虽然没有顺序级别，但是存在主次关系。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "无序列表（`<ul>`）中的列表项（`<li>`）之间没有顺序级别，也不存在主次关系，它们处于并列的层级。题目中“存在主次关系”的说法错误，易混淆于有序列表或嵌套列表。"
    },
    {
      "id": 39,
      "type": "judge",
      "chapter": 2,
      "scorable": true,
      "stem": "在定义单选按钮时，必须为同一组中的选项指定相同的name值，这样\"单选\"才会生效。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，单选按钮通过相同的name属性值来分组，同一组中只能选择一个选项。如果name值不同，则每个按钮独立，无法实现单选效果。这是HTML表单的基本规则。"
    },
    {
      "id": 40,
      "type": "judge",
      "chapter": 2,
      "scorable": true,
      "stem": "src属性可以让音频具有循环播放功能。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "src属性用于指定音频文件的URL，而循环播放功能由loop属性控制。因此，仅设置src属性无法实现循环播放，需添加loop属性。"
    },
    {
      "id": 41,
      "type": "single",
      "chapter": 3,
      "scorable": true,
      "stem": "关于创建锚点链接的代码,下列书写正确的是()。",
      "options": [
        {
          "key": "A",
          "text": "`<a href=\"#\">链接文本</a>……<h3 id=\"one\">锚点链接 </h3>`"
        },
        {
          "key": "B",
          "text": "`<a href=\"#one\">链接文本</a>……<h3 id=\"#one\">锚点链接 </h3>`"
        },
        {
          "key": "C",
          "text": "`<a href=\"#one\">链接文本</a>……<h3 id=\"one\">锚点链接 </h3>`"
        },
        {
          "key": "D",
          "text": "`<a href=\"#id\">链接文本</a>……<h3 id=\"one\">锚点链接 </h3>`"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "锚点链接的正确写法是：链接的href属性值为#加上目标元素的id值，目标元素的id值不加#。选项C符合规范。选项A的href=\"#\"表示空链接，不是锚点；选项B的目标id错误地加了#；选项D的href=\"#id\"与目标id不匹配。"
    },
    {
      "id": 42,
      "type": "single",
      "chapter": 3,
      "scorable": true,
      "stem": "下面的代码中,可以设置单元格宽度的是()。",
      "options": [
        {
          "key": "A",
          "text": "td{line-height:50px;}"
        },
        {
          "key": "B",
          "text": "td{font-size:50px;}"
        },
        {
          "key": "C",
          "text": "td{height:50px;}"
        },
        {
          "key": "D",
          "text": "td{width:50px;}"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "单元格宽度通过CSS的width属性设置。选项D正确，因为width直接控制单元格宽度。其他选项：A设置行高，B设置字体大小，C设置高度，均不影响宽度。易错点：混淆height和width。"
    },
    {
      "id": 43,
      "type": "single",
      "chapter": 3,
      "scorable": true,
      "stem": "关于HTML标签设置属性的基本语法格式，下列选项正确的是()。",
      "options": [
        {
          "key": "A",
          "text": "`<标签名 属性1=\"属性值1\"属性2=\"属性值2\"…>内容 </标签名>;`"
        },
        {
          "key": "B",
          "text": "`<标签名 属性1=\";属性值1\" 属性2=\";属性值2\"…> 内容 </标签名>;`"
        },
        {
          "key": "C",
          "text": "`<标签名 属性1=\"属性值1\" 属性2=\"属性值2\"…> 内容 </标签名>;`"
        },
        {
          "key": "D",
          "text": "`<title>属性</title>;`"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "HTML标签属性语法要求属性名和属性值之间用等号连接，属性值用双引号括起来，多个属性之间用空格分隔。选项C符合规范。选项A缺少属性间空格，选项B属性值前有多余分号，选项D是标签内容而非属性设置。"
    },
    {
      "id": 44,
      "type": "single",
      "chapter": 3,
      "scorable": true,
      "stem": "下列选项中，用来定义多行文本输入框的是 ()。",
      "options": [
        {
          "key": "A",
          "text": "`<input/>`"
        },
        {
          "key": "B",
          "text": "`<form>`"
        },
        {
          "key": "C",
          "text": "`<select></select>`"
        },
        {
          "key": "D",
          "text": "`<textarea></textarea>`"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "多行文本输入框使用`<textarea>`标签，其可以输入多行文本。而`<input>`通常用于单行输入，`<form>`用于表单容器，`<select>`用于下拉列表。因此正确答案是D。"
    },
    {
      "id": 45,
      "type": "single",
      "chapter": 3,
      "scorable": true,
      "stem": "以下选项中,哪个全部都是表格标签?()",
      "options": [
        {
          "key": "A",
          "text": "`<thead><body><tr>`"
        },
        {
          "key": "B",
          "text": "`<table><tr><tl>`"
        },
        {
          "key": "C",
          "text": "`<table><tr><td>`"
        },
        {
          "key": "D",
          "text": "`<table><head><tfoot>`"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "表格标签包括`<table>`、`<tr>`（行）、`<td>`（单元格）等。选项C全部是表格标签。A中`<body>`不是表格标签；B中`<tl>`不存在；D中`<head>`不是表格标签。"
    },
    {
      "id": 46,
      "type": "multiple",
      "chapter": 3,
      "scorable": true,
      "stem": "下列选项中，属于表单控件的是 ()。",
      "options": [
        {
          "key": "A",
          "text": "密码输入框"
        },
        {
          "key": "B",
          "text": "单行文本输入框"
        },
        {
          "key": "C",
          "text": "提交按钮"
        },
        {
          "key": "D",
          "text": "复选框"
        }
      ],
      "answer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "表单控件包括输入框、按钮、复选框等，用于用户交互和数据提交。密码输入框、单行文本输入框、提交按钮和复选框都是常见的表单控件，因此全部正确。"
    },
    {
      "id": 47,
      "type": "multiple",
      "chapter": 3,
      "scorable": true,
      "stem": "下列选项中，属于`<textarea>`标签的必须属性的是 ()",
      "options": [
        {
          "key": "A",
          "text": "value"
        },
        {
          "key": "B",
          "text": "rows"
        },
        {
          "key": "C",
          "text": "size"
        },
        {
          "key": "D",
          "text": "cols"
        }
      ],
      "answer": [
        "B",
        "D"
      ],
      "explanation": "`<textarea>`标签的必须属性是rows和cols，它们定义了文本区域的可见行数和列数。value不是属性，而是标签内容；size不是textarea的属性。易错点：混淆input和textarea的属性。"
    },
    {
      "id": 48,
      "type": "judge",
      "chapter": 3,
      "scorable": true,
      "stem": "在定义下拉列表时，`<optgroup>`标签有一个必需属性label，用于定义具体的组名。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，`<optgroup>`标签用于对`<select>`下拉列表中的选项进行分组，其label属性是必需的，用于定义组名，以便用户识别。如果没有label属性，分组将无意义。因此，该说法正确。"
    },
    {
      "id": 49,
      "type": "judge",
      "chapter": 3,
      "scorable": true,
      "stem": "HTML5中的form属性，可以把表单内的子元素写在页面中的任一位置。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "HTML5的form属性允许表单控件通过指定form属性值关联到页面中任意位置的表单，无需将控件放在form元素内部。这提高了布局灵活性，但需注意form属性值必须与对应表单的id匹配。"
    },
    {
      "id": 50,
      "type": "judge",
      "chapter": 3,
      "scorable": true,
      "stem": "method属性用于设置表单数据的提交方式。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "method属性是HTML表单元素的重要属性，用于指定表单数据提交的HTTP方法，常见取值为GET或POST。题干表述正确，符合HTML规范。"
    },
    {
      "id": 51,
      "type": "judge",
      "chapter": 3,
      "scorable": true,
      "stem": "一个标签只能设置一个属性。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "HTML标签可以设置多个属性，例如`<a href=\"...\" target=\"_blank\">`同时设置了href和target属性。题目说法错误，易混淆为某些属性只能出现一次。"
    },
    {
      "id": 52,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "CSS3中，()选择器用于为父元素中的第一个子元素设置样式。",
      "options": [
        {
          "key": "A",
          "text": "first-child"
        },
        {
          "key": "B",
          "text": "nth-child"
        },
        {
          "key": "C",
          "text": "only-child"
        },
        {
          "key": "D",
          "text": "last-child"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "first-child选择器用于匹配父元素中的第一个子元素，并为其设置样式。选项A正确。nth-child(n)选择第n个子元素，only-child选择唯一的子元素，last-child选择最后一个子元素，均不符合题意。"
    },
    {
      "id": 53,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "()属性用于调整重叠定位元素的堆叠顺序。",
      "options": [
        {
          "key": "A",
          "text": "order"
        },
        {
          "key": "B",
          "text": "z-index"
        },
        {
          "key": "C",
          "text": "index"
        },
        {
          "key": "D",
          "text": "list"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "z-index属性用于控制定位元素（如position: relative/absolute/fixed/sticky）的堆叠顺序，值越大越靠上。order用于flex布局，index和list无此功能。"
    },
    {
      "id": 54,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "()属性是CSS3的新增属性，用于定义服务器字体。通过此属性，开发者可以在用户计算机未安装字体时，使用任何喜欢的字体。",
      "options": [
        {
          "key": "A",
          "text": "@font-face"
        },
        {
          "key": "B",
          "text": "@font"
        },
        {
          "key": "C",
          "text": "face"
        },
        {
          "key": "D",
          "text": "font-family"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "@font-face 是 CSS3 新增的规则，允许开发者定义服务器字体，当用户计算机未安装该字体时，浏览器会从服务器下载并使用。选项 A 正确。@font 和 face 不是有效 CSS 属性，font-family 用于指定字体族名称，但不能定义服务器字体。"
    },
    {
      "id": 55,
      "type": "multiple",
      "chapter": 4,
      "scorable": true,
      "stem": "下列选项中，用于更改元素内边距的是（ ）。",
      "options": [
        {
          "key": "A",
          "text": "padding-left"
        },
        {
          "key": "B",
          "text": "padding-right"
        },
        {
          "key": "C",
          "text": "text-indent"
        },
        {
          "key": "D",
          "text": "margin-left"
        }
      ],
      "answer": [
        "A",
        "B"
      ],
      "explanation": "padding-left 用于设置元素左内边距，padding-right 用于设置元素右内边距，二者都属于 padding 内边距属性。text-indent 是文本缩进，margin-left 是外边距。因此本题应为多选题，答案为 A、B。"
    },
    {
      "id": 56,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "()属性用于设置文本的下划线，上划线，删除线等装饰效果。",
      "options": [
        {
          "key": "A",
          "text": "text-transform"
        },
        {
          "key": "B",
          "text": "text-indent"
        },
        {
          "key": "C",
          "text": "text-decoration"
        },
        {
          "key": "D",
          "text": "text-align"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "text-decoration属性用于设置文本的装饰效果，如下划线、上划线、删除线等。text-transform控制大小写，text-indent控制缩进，text-align控制对齐，均不符合题意。"
    },
    {
      "id": 57,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "层次选择器中表示相邻兄弟选择器的是 ()。",
      "options": [
        {
          "key": "A",
          "text": "E ~ F"
        },
        {
          "key": "B",
          "text": "E + F"
        },
        {
          "key": "C",
          "text": "E > F"
        },
        {
          "key": "D",
          "text": "E F"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "相邻兄弟选择器使用加号（+）连接两个元素，表示选择紧接在E元素后的第一个F元素。选项A是通用兄弟选择器，C是子选择器，D是后代选择器。"
    },
    {
      "id": 58,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列属性中不属于float的属性为 ()。",
      "options": [
        {
          "key": "A",
          "text": "none"
        },
        {
          "key": "B",
          "text": "both"
        },
        {
          "key": "C",
          "text": "right"
        },
        {
          "key": "D",
          "text": "left"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "float属性在CSS中用于设置元素的浮动方向，其可选值包括none（不浮动）、left（左浮动）、right（右浮动）和inherit（继承父元素）。选项B的both不是float的有效值，它是clear属性的值，用于清除浮动。因此，不属于float属性的选项是B。"
    },
    {
      "id": 59,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列选项中，用于设置首行文本缩进的属性是 ()。",
      "options": [
        {
          "key": "A",
          "text": "text-shadow"
        },
        {
          "key": "B",
          "text": "text-overflow"
        },
        {
          "key": "C",
          "text": "white-space"
        },
        {
          "key": "D",
          "text": "text-indent"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "text-indent属性用于设置文本块中首行文本的缩进，是CSS中专门控制首行缩进的属性。其他选项：text-shadow设置文本阴影，text-overflow处理文本溢出，white-space控制空白符处理，均与首行缩进无关。"
    },
    {
      "id": 60,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列选项中，用于设置边框样式的属性是 ()。",
      "options": [
        {
          "key": "A",
          "text": "border-height"
        },
        {
          "key": "B",
          "text": "border-color"
        },
        {
          "key": "C",
          "text": "border-style"
        },
        {
          "key": "D",
          "text": "border-width"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "border-style属性用于设置边框的样式，如solid、dashed等。border-color设置颜色，border-width设置宽度，没有border-height属性。"
    },
    {
      "id": 61,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列选项中，用来表示通配符选择器的符号是 ()。",
      "options": [
        {
          "key": "A",
          "text": "*"
        },
        {
          "key": "B",
          "text": "."
        },
        {
          "key": "C",
          "text": "?"
        },
        {
          "key": "D",
          "text": "#"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "通配符选择器用星号（*）表示，可以匹配页面中的所有元素。选项B是类选择器，选项D是ID选择器，选项C不是有效的CSS选择器符号。"
    },
    {
      "id": 62,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "()是将所有的样式放在一个或多个以.css为扩展名的外部样式表文件中，实现了结构和样式完全分离。",
      "options": [
        {
          "key": "A",
          "text": "!important"
        },
        {
          "key": "B",
          "text": "内嵌式"
        },
        {
          "key": "C",
          "text": "外链式"
        },
        {
          "key": "D",
          "text": "行内式"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "外链式（外部样式表）将CSS代码单独存放在.css文件中，通过`<link>`标签引入HTML文档，实现了结构与样式的完全分离。内嵌式和行内式则未完全分离，!important是CSS优先级规则。"
    },
    {
      "id": 63,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列选项中，关于选择器权重的优先级的说法正确的是 ()。",
      "options": [
        {
          "key": "A",
          "text": "ID选择器 > 类选择器 > 标签选择器"
        },
        {
          "key": "B",
          "text": "标签选择器 > 类选择器 > ID选择器"
        },
        {
          "key": "C",
          "text": "类选择器 < ID选择器 < 标签选择器"
        },
        {
          "key": "D",
          "text": "标签选择器 > ID选择器 > 类选择器"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "CSS选择器优先级中，ID选择器权重最高（0,1,0,0），类选择器次之（0,0,1,0），标签选择器最低（0,0,0,1）。因此正确顺序为ID选择器 > 类选择器 > 标签选择器，对应选项A。"
    },
    {
      "id": 64,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "id选择器使用 () 进行标识，后面紧跟id名。",
      "options": [
        {
          "key": "A",
          "text": "#"
        },
        {
          "key": "B",
          "text": "^"
        },
        {
          "key": "C",
          "text": "$"
        },
        {
          "key": "D",
          "text": "."
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在CSS中，id选择器使用井号（#）进行标识，后面紧跟id名。例如，#myId表示选择id为myId的元素。其他选项中，^和$是正则表达式中的符号，.是类选择器的标识符。因此正确答案是A。"
    },
    {
      "id": 65,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "CSS样式规则由选择器和声明构成。写法正确的是（ ）。",
      "options": [
        {
          "key": "A",
          "text": "选择器{属性1:属性值1; 属性2:属性值2; 属性3:属性值3;}"
        },
        {
          "key": "B",
          "text": "选择器(属性1:属性值1; 属性2:属性值2; 属性3:属性值3;)"
        },
        {
          "key": "C",
          "text": "选择器{属性1=属性值1; 属性2=属性值2; 属性3=属性值3;}"
        },
        {
          "key": "D",
          "text": "{选择器:属性1:属性值1; 属性2:属性值2; 属性3:属性值3;}"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "CSS 规则由选择器和声明块组成，声明块写在花括号中；每条声明由“属性: 属性值”构成，多条声明之间用分号分隔。A 符合语法；B 使用圆括号，C 使用等号，D 把选择器写进声明块，均不正确。"
    },
    {
      "id": 66,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "在设置页面布局时，可以使用 () 的布局方法。",
      "options": [
        {
          "key": "A",
          "text": "绝对定位法"
        },
        {
          "key": "B",
          "text": "相对定位法"
        },
        {
          "key": "C",
          "text": "浮动法"
        },
        {
          "key": "D",
          "text": "以上方法均可以"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "在设置页面布局时，绝对定位、相对定位和浮动都是常用的CSS布局方法。绝对定位使元素脱离文档流，相对定位保留原位置，浮动用于实现文字环绕或横向排列。三种方法均可用于页面布局，因此D选项正确。"
    },
    {
      "id": 67,
      "type": "single",
      "chapter": 4,
      "scorable": true,
      "stem": "下列样式代码中，可以实现相对定位的是 ()。",
      "options": [
        {
          "key": "A",
          "text": "position: fixed;"
        },
        {
          "key": "B",
          "text": "position: absolute;"
        },
        {
          "key": "C",
          "text": "position: static;"
        },
        {
          "key": "D",
          "text": "position: relative;"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "相对定位使用position: relative;，元素相对于其正常位置进行偏移，同时保留原占位空间。选项A是固定定位，B是绝对定位，C是静态定位（默认），均不符合相对定位的定义。"
    },
    {
      "id": 68,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "在驼峰式命名中，所有单词都要大写。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "驼峰式命名分为小驼峰和大驼峰。小驼峰首单词小写，后续单词首字母大写，如'firstName'；大驼峰所有单词首字母大写，如'FirstName'。题干说所有单词都要大写，这是错误的，因为小驼峰首单词小写。"
    },
    {
      "id": 69,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "CSS3中，nth-last-of-type(n)选择器属于结构化伪类选择器。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "nth-last-of-type(n)是CSS3中新增的结构化伪类选择器，它根据元素在其父元素中同类型子元素的位置（从后往前计数）进行选择，属于结构化伪类。"
    },
    {
      "id": 70,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "当对元素应用overflow:hidden;样式时，元素的溢出内容会被修剪。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "overflow:hidden; 会隐藏超出元素内容区域的溢出部分，因此正确。注意：该属性不会触发滚动条，溢出内容完全不可见。"
    },
    {
      "id": 71,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "当表格的border-collapse属性设置为collapse时，HTML中设置的cellspacing属性无效。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "当border-collapse: collapse时，表格边框合并，单元格间距由CSS控制，HTML的cellspacing属性失效。"
    },
    {
      "id": 72,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "设置了浮动属性值为left的元素不会脱离标准文档流的控制。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "设置了浮动属性值为left的元素会脱离标准文档流，不再占据原位置，后续元素会填补其空间。这是CSS浮动的基本特性，易错点在于混淆浮动与定位的脱离文档流概念。"
    },
    {
      "id": 73,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "在设置边框颜色时，无需同时设置边框样式就能显示边框。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "边框颜色必须与边框样式同时设置才能显示，因为默认边框样式为none，此时边框不可见。即使设置了颜色，若样式为none，边框仍不会显示。"
    },
    {
      "id": 74,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "E[attr*=value]属性选择器中，E可以省略。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "E[attr*=value]选择器中，E表示元素类型，可以省略。省略时表示匹配所有包含该属性的元素，这是CSS属性选择器的通用规则。"
    },
    {
      "id": 75,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "父子标签的外边距发生合并。若子元素是父元素的第一个子元素，且父标签没有上内边距及边框，则父标签的上外边距会与子标签的上外边距发生合并。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "这是CSS外边距合并的典型情况。当父元素没有上内边距或边框时，其第一个子元素的上外边距会与父元素的上外边距合并，取两者中的较大值。"
    },
    {
      "id": 76,
      "type": "judge",
      "chapter": 4,
      "scorable": true,
      "stem": "`<div>`默认是块元素。()",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在HTML中，`<div>`标签默认是块级元素，会独占一行，宽度默认填满父容器。这是CSS的基础知识，正确。"
    },
    {
      "id": 77,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "如何求得2和4中最大的数( )。",
      "options": [
        {
          "key": "A",
          "text": "Math.max(2,4)"
        },
        {
          "key": "B",
          "text": "top(2,4)"
        },
        {
          "key": "C",
          "text": "Math.min(2,4)"
        },
        {
          "key": "D",
          "text": "Math.ceil(2,4)"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "Math.max(2,4)返回两个数中的最大值，结果为4。其他选项：top不是JavaScript函数；Math.min返回最小值；Math.ceil用于向上取整，不能比较大小。"
    },
    {
      "id": 78,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中，可以实现警告框的是( )。",
      "options": [
        {
          "key": "A",
          "text": "console.log()"
        },
        {
          "key": "B",
          "text": "alert()"
        },
        {
          "key": "C",
          "text": "prompt()"
        },
        {
          "key": "D",
          "text": "document.write()"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "alert() 方法用于显示带有一条指定消息和一个确认按钮的警告框，符合题目要求。console.log() 在控制台输出信息，prompt() 显示可输入对话框，document.write() 向文档写入内容，均不产生警告框。"
    },
    {
      "id": 79,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "在JavaScript中可以使用Date对象的( )方法返回该对象的某一天具体的日期。",
      "options": [
        {
          "key": "A",
          "text": "getMonth()"
        },
        {
          "key": "B",
          "text": "getYear()"
        },
        {
          "key": "C",
          "text": "getDate()"
        },
        {
          "key": "D",
          "text": "getTime()"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "getDate()方法返回一个月中的某一天（1-31），符合题目要求。getMonth()返回月份（0-11），getYear()返回年份（通常为当前年份减1900），getTime()返回时间戳。易错点：getDate()与getDay()（返回星期几）易混淆。"
    },
    {
      "id": 80,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "在 JavaScript 中，用于向数组**开头**添加元素的正确方法是（　）",
      "options": [
        {
          "key": "A",
          "text": "push()"
        },
        {
          "key": "B",
          "text": "unshift()"
        },
        {
          "key": "C",
          "text": "pop()"
        },
        {
          "key": "D",
          "text": "shift()"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "unshift() 在数组开头添加元素，push() 在末尾添加，pop() 从末尾删除，shift() 从开头删除。"
    },
    {
      "id": 81,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "在使用构造函数创建对象时，构造函数内部的this表示( )。",
      "options": [
        {
          "key": "A",
          "text": "新创建的对象"
        },
        {
          "key": "B",
          "text": "window对象"
        },
        {
          "key": "C",
          "text": "构造函数本身"
        },
        {
          "key": "D",
          "text": "原型对象"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在JavaScript中，使用new关键字调用构造函数时，构造函数内部的this指向新创建的对象实例。这是构造函数的核心特性，用于初始化新对象的属性。易错点：若忘记使用new，则this指向全局对象（如window），但题目明确指定“使用构造函数创建对象”，故应选A。"
    },
    {
      "id": 82,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下列关于Javascript特征说法错误的是( )。",
      "options": [
        {
          "key": "A",
          "text": "Javascript支持面向对象"
        },
        {
          "key": "B",
          "text": "Javascript是一种非脚本语言"
        },
        {
          "key": "C",
          "text": "Javascript是事件驱动的"
        },
        {
          "key": "D",
          "text": "Javascript是独立于平台的"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "JavaScript是一种脚本语言，而非非脚本语言，因此选项B说法错误。JavaScript支持面向对象编程、事件驱动，并且独立于平台运行，故A、C、D正确。"
    },
    {
      "id": 83,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中，可以获取到父节点的是()。",
      "options": [
        {
          "key": "A",
          "text": "childrenNode"
        },
        {
          "key": "B",
          "text": "parent"
        },
        {
          "key": "C",
          "text": "parentNode"
        },
        {
          "key": "D",
          "text": "Node"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "在DOM中，parentNode属性用于获取当前节点的父节点，而parent不是标准属性，childrenNode和Node也不正确。因此正确答案是C。"
    },
    {
      "id": 84,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中,( )可以修改指定元素的指定属性值。",
      "options": [
        {
          "key": "A",
          "text": "removeAttribute()"
        },
        {
          "key": "B",
          "text": "setAttribute()"
        },
        {
          "key": "C",
          "text": "attributes"
        },
        {
          "key": "D",
          "text": "getAttribute()"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "setAttribute()方法用于设置或修改指定元素的指定属性值。removeAttribute()用于删除属性，attributes是属性集合，getAttribute()用于获取属性值。因此正确答案是B。"
    },
    {
      "id": 85,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "在JavaScript中，有var p=document.getElementById(\"data\"),则使用DOM将data对应内容设置为黄色的语句中正确的是( )。",
      "options": [
        {
          "key": "A",
          "text": "p.style.backgroundColor=\"yellow\""
        },
        {
          "key": "B",
          "text": "p.style.color=\"yellow\""
        },
        {
          "key": "C",
          "text": "p.color=\"yellow\""
        },
        {
          "key": "D",
          "text": "p.backgroundColor=\"yellow\""
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在JavaScript中，通过DOM获取元素后，设置CSS样式需通过style属性访问具体的CSS属性。背景色对应的CSS属性是backgroundColor，因此正确写法是p.style.backgroundColor=\"yellow\"。选项B设置的是文字颜色，选项C和D直接给元素对象添加属性，无法生效。"
    },
    {
      "id": 86,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "若字符串的indexOf方法查找失败，则返回( )。",
      "options": [
        {
          "key": "A",
          "text": "-1"
        },
        {
          "key": "B",
          "text": "null"
        },
        {
          "key": "C",
          "text": "false"
        },
        {
          "key": "D",
          "text": "0"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "JavaScript中，String.prototype.indexOf()方法在查找失败时返回-1，而不是null、false或0。这是该方法的固定行为，用于表示未找到子字符串。"
    },
    {
      "id": 87,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下面关于事件的描述错误的是( )。",
      "options": [
        {
          "key": "A",
          "text": "事件处理程序指的是事件触发后要执行的代码"
        },
        {
          "key": "B",
          "text": "事件源是指触发事件的元素"
        },
        {
          "key": "C",
          "text": "事件指的是可以被JavaScript侦测到的行为"
        },
        {
          "key": "D",
          "text": "以上说法都不正确"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "选项A、B、C分别正确描述了事件处理程序、事件源和事件的定义。因此D选项“以上说法都不正确”是错误的，故本题选D。"
    },
    {
      "id": 88,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中，可以实现创建元素的是( )。",
      "options": [
        {
          "key": "A",
          "text": "document.createElement(\"p\")"
        },
        {
          "key": "B",
          "text": "element.innerValue=\"你好\""
        },
        {
          "key": "C",
          "text": "element.pop(\"你好\")"
        },
        {
          "key": "D",
          "text": "element.push(\"你好\")"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "document.createElement() 是 DOM 方法，用于创建指定标签名的元素节点。其他选项：innerValue 不存在，pop 和 push 是数组方法，不能创建元素。"
    },
    {
      "id": 89,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "程序片段：var str1=\"12year\"; var i=str1.indexOf(\"2\"); alert(i);运行后，警告框消息为( )。",
      "options": [
        {
          "key": "A",
          "text": "1"
        },
        {
          "key": "B",
          "text": "2"
        },
        {
          "key": "C",
          "text": "12"
        },
        {
          "key": "D",
          "text": "p"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "indexOf方法返回指定字符在字符串中首次出现的位置索引，从0开始。字符串\"12year\"中字符\"2\"首次出现在索引1，因此alert(i)输出1。易错点：索引从0开始计数。"
    },
    {
      "id": 90,
      "type": "single",
      "chapter": 5,
      "scorable": true,
      "stem": "当调整window窗口大小的时候，就会触发的事件是( )。",
      "options": [
        {
          "key": "A",
          "text": "window.onload"
        },
        {
          "key": "B",
          "text": "document.DOMContentLoaded"
        },
        {
          "key": "C",
          "text": "window.innerWidth"
        },
        {
          "key": "D",
          "text": "window.onresize"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "window.onresize事件在窗口大小改变时触发。A选项window.onload在页面完全加载后触发，B选项DOMContentLoaded在DOM解析完成后触发，C选项window.innerWidth是属性而非事件。"
    },
    {
      "id": 91,
      "type": "multiple",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中,( )属于内置对象。",
      "options": [
        {
          "key": "A",
          "text": "Math"
        },
        {
          "key": "B",
          "text": "String"
        },
        {
          "key": "C",
          "text": "Date"
        },
        {
          "key": "D",
          "text": "Array"
        }
      ],
      "answer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "在JavaScript中，Math、String、Date和Array都是内置对象，它们由语言本身提供，无需额外引入即可使用。因此所有选项均正确。"
    },
    {
      "id": 92,
      "type": "multiple",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中属于文本节点的是( )。",
      "options": [
        {
          "key": "A",
          "text": "注释"
        },
        {
          "key": "B",
          "text": "元素"
        },
        {
          "key": "C",
          "text": "空格"
        },
        {
          "key": "D",
          "text": "换行"
        }
      ],
      "answer": [
        "C",
        "D"
      ],
      "explanation": "在DOM中，文本节点包括纯文本内容，如空格和换行符。注释是注释节点，元素是元素节点，因此只有空格和换行属于文本节点。"
    },
    {
      "id": 93,
      "type": "multiple",
      "chapter": 5,
      "scorable": true,
      "stem": "下列选项中，属于JavaScript注释的是( )。",
      "options": [
        {
          "key": "A",
          "text": "`<!-- -->`"
        },
        {
          "key": "B",
          "text": "`/* */`"
        },
        {
          "key": "C",
          "text": "`#`"
        },
        {
          "key": "D",
          "text": "`//`"
        }
      ],
      "answer": [
        "B",
        "D"
      ],
      "explanation": "JavaScript支持两种注释：单行注释使用//，多行注释使用/* */。选项A是HTML注释，选项C是Python等语言的注释，不属于JavaScript。因此正确答案是B和D。"
    },
    {
      "id": 94,
      "type": "multiple",
      "chapter": 5,
      "scorable": true,
      "stem": "下面属于符号\"+\"的功能是( )。",
      "options": [
        {
          "key": "A",
          "text": "正数"
        },
        {
          "key": "B",
          "text": "字符串连接"
        },
        {
          "key": "C",
          "text": "自增"
        },
        {
          "key": "D",
          "text": "相加"
        }
      ],
      "answer": [
        "A",
        "B",
        "D"
      ],
      "explanation": "在JavaScript中，'+'运算符具有多重功能：作为一元运算符表示正数（如+5），作为二元运算符用于字符串连接（如'a'+'b'）和数值相加（如1+2）。自增功能由'++'运算符实现，而非单独的'+'。因此正确选项为A、B、D。"
    },
    {
      "id": 95,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "事件是指可以被JavaScript侦测到的行为，是一种\"触发-响应\"的机制。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "事件是JavaScript中用户操作或浏览器行为（如点击、加载）的触发点，通过监听事件并执行相应函数实现交互，符合“触发-响应”机制。"
    },
    {
      "id": 96,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "JavaScript不声明变量的数据类型，变量可直接使用。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "JavaScript是弱类型语言，变量无需声明类型即可使用，且可随时改变数据类型。但严格模式下未声明变量会报错，本题基于常规情况判定正确。"
    },
    {
      "id": 97,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "调用日期对象的getMonth()方法获取的月份，范围为1~12(1表示一月，2表示二月，依次类推)。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "getMonth()方法返回的月份是从0开始的整数，范围是0~11，其中0表示一月，1表示二月，依此类推。题目中描述为1~12是错误的，因此答案为false。"
    },
    {
      "id": 98,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "JavaScript语言中，调用Math.random()可以获取0到1(包括0和1)之间的随机数。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "Math.random() 返回 [0, 1) 之间的随机浮点数，包括0但不包括1。题目说包括0和1，这是错误的，因为1不会被包含。"
    },
    {
      "id": 99,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "JavaScript中的变量必须在声明的同时赋值。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "JavaScript中变量可以先声明后赋值，例如：let a; a = 1;。声明时赋值不是必须的，未赋值的变量默认值为undefined。"
    },
    {
      "id": 100,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "调用document.getElementById(id)方法返回的是拥有指定id的元素。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "document.getElementById(id) 方法根据传入的 id 返回匹配的第一个元素对象，若不存在则返回 null。题干描述正确，注意该方法返回的是元素对象而非集合。"
    },
    {
      "id": 101,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "JavaScript可以使用数组名[索引]的方式来访问数组元素。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "JavaScript中数组索引从0开始，通过方括号加索引即可访问对应元素，如arr[0]访问第一个元素。这是数组的基本操作，正确。"
    },
    {
      "id": 102,
      "type": "judge",
      "chapter": 5,
      "scorable": true,
      "stem": "使用var声明变量y后，alert(typeof y)将显示字符型。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "var声明的变量y未赋值时，typeof y返回'undefined'，而非字符型。字符型指字符串，typeof操作符对未初始化变量返回'undefined'字符串，但这是undefined类型，不是字符型。易错点：混淆typeof返回值与变量实际类型。"
    },
    {
      "id": 103,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "下面选项中，表示浏览器对象模型的是( )。",
      "options": [
        {
          "key": "A",
          "text": "BOM"
        },
        {
          "key": "B",
          "text": "window"
        },
        {
          "key": "C",
          "text": "DOM"
        },
        {
          "key": "D",
          "text": "document"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "浏览器对象模型（Browser Object Model）的缩写是BOM，它提供了与浏览器窗口交互的对象和方法。window是BOM的核心对象，但题目问的是表示浏览器对象模型的术语，因此选A。DOM是文档对象模型，document是DOM的一部分。"
    },
    {
      "id": 104,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "可获取当前元素对象ele所在层级的最后一个节点的是()。",
      "options": [
        {
          "key": "A",
          "text": "ele.parentNode"
        },
        {
          "key": "B",
          "text": "以上答案都不正确"
        },
        {
          "key": "C",
          "text": "ele.lastChild"
        },
        {
          "key": "D",
          "text": "ele.parentNode.lastChild"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "ele.parentNode 获取父节点；ele.lastChild 获取 ele 自身的最后一个子节点；ele.parentNode.lastChild 获取 ele 父节点的最后一个子节点，也就是 ele 所在同一层级中的最后一个节点。因此正确答案是 D。"
    },
    {
      "id": 105,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "Javascript中，需要声明一个整数变量num，以下语句正确的是( )。",
      "options": [
        {
          "key": "A",
          "text": "number num;"
        },
        {
          "key": "B",
          "text": "var num;"
        },
        {
          "key": "C",
          "text": "Integer num;"
        },
        {
          "key": "D",
          "text": "int num;"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "JavaScript是弱类型语言，声明变量使用var、let或const，不需要指定类型。选项B正确。其他选项如int、Integer、number是其他语言的语法，在JavaScript中无效。"
    },
    {
      "id": 106,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "'8'+8的结果是( )。",
      "options": [
        {
          "key": "A",
          "text": "undefined"
        },
        {
          "key": "B",
          "text": "88"
        },
        {
          "key": "C",
          "text": "NaN"
        },
        {
          "key": "D",
          "text": "16"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "在JavaScript中，当字符串与数字进行加法运算时，数字会被转换为字符串，然后进行字符串拼接。因此'8'+8的结果是字符串'88'，而不是数字16。易错点：误以为加法会进行数值计算。"
    },
    {
      "id": 107,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "下面关于字符串的描述错误的是( )。",
      "options": [
        {
          "key": "A",
          "text": "单引号中使用单引号不需要转义"
        },
        {
          "key": "B",
          "text": "双引号中使用单引号不需要转义"
        },
        {
          "key": "C",
          "text": "单引号或双引号包裹的数据称为字符串"
        },
        {
          "key": "D",
          "text": "双引号内使用换行需要转义"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "在JavaScript中，单引号内不能直接包含单引号，必须转义（如\\'），否则会语法错误。选项A说不需要转义是错误的。其他选项正确：双引号内可包含单引号无需转义；单引号或双引号包裹的是字符串；双引号内换行需转义（\\n）。"
    },
    {
      "id": 108,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "下列选项中，可以实现循环遍历页面中标签的是()。",
      "options": [
        {
          "key": "A",
          "text": "if(){}else{}"
        },
        {
          "key": "B",
          "text": "for(){}"
        },
        {
          "key": "C",
          "text": "if(){}"
        },
        {
          "key": "D",
          "text": "switch(){}"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "循环遍历需要使用循环结构，for(){}是循环语句，可以重复执行代码块来遍历元素。if、switch是条件语句，不能实现循环。"
    },
    {
      "id": 109,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "在网页中单击鼠标左键时会触发( )事件。",
      "options": [
        {
          "key": "A",
          "text": "clicks"
        },
        {
          "key": "B",
          "text": "dblclick"
        },
        {
          "key": "C",
          "text": "onclick"
        },
        {
          "key": "D",
          "text": "onfocus"
        }
      ],
      "answer": [
        "C"
      ],
      "explanation": "单击鼠标左键触发的是click事件，在HTML中通常使用onclick属性或addEventListener('click', handler)来绑定。选项A的'clicks'不是标准事件名；B的'dblclick'是双击事件；D的'onfocus'是获得焦点事件。因此正确答案是C。"
    },
    {
      "id": 110,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "执行程序代码var a;console.log(a);后控制台的输出结果为( )。",
      "options": [
        {
          "key": "A",
          "text": "null"
        },
        {
          "key": "B",
          "text": "0"
        },
        {
          "key": "C",
          "text": "\"\""
        },
        {
          "key": "D",
          "text": "undefined"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "在JavaScript中，使用var声明变量但未初始化时，变量的默认值为undefined。因此执行var a;后，a的值为undefined，console.log(a)输出undefined。易错点：null是主动赋值的空值，与undefined不同。"
    },
    {
      "id": 111,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "为了实现3秒后自动关闭广告的效果，可以使用( )来实现。",
      "options": [
        {
          "key": "A",
          "text": "setInterval()"
        },
        {
          "key": "B",
          "text": "clearInterval()"
        },
        {
          "key": "C",
          "text": "clearTimeout()"
        },
        {
          "key": "D",
          "text": "setTimeout()"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "setTimeout()用于在指定延迟后执行一次函数，适合实现3秒后自动关闭广告。setInterval()会重复执行，不符合需求。clearTimeout()和clearInterval()用于取消定时器，不能直接实现延迟执行。"
    },
    {
      "id": 112,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "HTML DOM中的根节点是( )。",
      "options": [
        {
          "key": "A",
          "text": "head"
        },
        {
          "key": "B",
          "text": "div"
        },
        {
          "key": "C",
          "text": "window"
        },
        {
          "key": "D",
          "text": "document"
        }
      ],
      "answer": [
        "D"
      ],
      "explanation": "在HTML DOM中，根节点是document对象，它代表整个HTML文档，是所有其他节点的父节点。head和div是元素节点，window是BOM对象，不是DOM根节点。"
    },
    {
      "id": 113,
      "type": "multiple",
      "chapter": 6,
      "scorable": true,
      "stem": "下面选项中，( )属于清除定时器方法。",
      "options": [
        {
          "key": "A",
          "text": "clearInterval()"
        },
        {
          "key": "B",
          "text": "setInterval()"
        },
        {
          "key": "C",
          "text": "setTimeout()"
        },
        {
          "key": "D",
          "text": "clearTimeout()"
        }
      ],
      "answer": [
        "A",
        "D"
      ],
      "explanation": "清除定时器的方法包括clearInterval()用于清除setInterval()创建的定时器，以及clearTimeout()用于清除setTimeout()创建的定时器。setInterval()和setTimeout()是创建定时器的方法，不是清除方法。"
    },
    {
      "id": 114,
      "type": "multiple",
      "chapter": 6,
      "scorable": true,
      "stem": "下列选项中，可以获取当前元素节点的兄弟节点的是( )。",
      "options": [
        {
          "key": "A",
          "text": "childNodes"
        },
        {
          "key": "B",
          "text": "nextSibling"
        },
        {
          "key": "C",
          "text": "parentNode"
        },
        {
          "key": "D",
          "text": "previousSibling"
        }
      ],
      "answer": [
        "B",
        "D"
      ],
      "explanation": "nextSibling 获取下一个兄弟节点，previousSibling 获取上一个兄弟节点，两者均可获取兄弟节点。childNodes 获取子节点，parentNode 获取父节点，均不符合题意。"
    },
    {
      "id": 115,
      "type": "judge",
      "chapter": 6,
      "scorable": true,
      "stem": "JavaScript不可以跨平台。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "JavaScript可以在多种平台上运行，包括浏览器、服务器（Node.js）、移动端等，因此具有跨平台特性。题干说法错误。"
    },
    {
      "id": 116,
      "type": "judge",
      "chapter": 6,
      "scorable": true,
      "stem": "在JavaScript中，使用childNodes属性和children属性获得的对象是一样的。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "childNodes 返回包含文本节点和注释节点的 NodeList，而 children 只返回元素节点。因此两者返回的对象不同，尤其在存在空白文本节点时差异明显。"
    },
    {
      "id": 117,
      "type": "judge",
      "chapter": 6,
      "scorable": true,
      "stem": "JavaScript中的循环跳转语句break和continue作用完全相同。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "break用于立即终止整个循环，而continue仅跳过当前迭代，继续下一次循环。两者作用不同，因此该说法错误。易错点在于混淆两者功能。"
    },
    {
      "id": 118,
      "type": "judge",
      "chapter": 6,
      "scorable": true,
      "stem": "使用var声明变量y后，alert(typeof y)将显示字符型。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "B"
      ],
      "explanation": "var声明的变量y未赋值时，typeof y返回'undefined'，而非字符型。typeof运算符的结果是字符串，但这里指变量类型为undefined，不是字符型。易错点：混淆typeof返回值的类型与变量实际类型。"
    },
    {
      "id": 119,
      "type": "judge",
      "chapter": 6,
      "scorable": true,
      "stem": "JavaScript提供的常用内置对象包括字符串对象、数学对象、日期对象、数组对象。( )",
      "options": [
        {
          "key": "A",
          "text": "正确"
        },
        {
          "key": "B",
          "text": "错误"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "JavaScript确实提供了这些常用内置对象：String、Math、Date、Array，它们都是全局对象，可直接使用。题目表述正确，注意内置对象无需实例化即可调用其静态方法，但String和Array通常以实例形式使用。"
    },
    {
      "id": 120,
      "type": "single",
      "chapter": 6,
      "scorable": true,
      "stem": "阅读下面的代码，执行后控制台两行依次输出的是（　）\n\n```javascript\nvar funcs = [];\nfor (var i = 0; i < 3; i++) {\n  funcs.push(function () { return i; });\n}\nconsole.log(funcs[0](), funcs[1](), funcs[2]());\n\nvar lets = [];\nfor (let j = 0; j < 3; j++) {\n  lets.push(function () { return j; });\n}\nconsole.log(lets[0](), lets[1](), lets[2]());\n```",
      "options": [
        {
          "key": "A",
          "text": "第一行 `3 3 3`，第二行 `0 1 2`"
        },
        {
          "key": "B",
          "text": "第一行 `0 1 2`，第二行 `0 1 2`"
        },
        {
          "key": "C",
          "text": "第一行 `3 3 3`，第二行 `3 3 3`"
        },
        {
          "key": "D",
          "text": "第一行 `0 1 2`，第二行 `3 3 3`"
        },
        {
          "key": "E",
          "text": "代码直接抛错，因为 let 不能用在 for 循环里"
        }
      ],
      "answer": [
        "A"
      ],
      "explanation": "第一段用 var 声明的 i 属于函数作用域，整个循环从头到尾共用同一个变量。循环结束时 i 已经加到 3，三个闭包读到的都是这同一个 i，所以输出 `3 3 3`。第二段用 let 声明的 j 属于块级作用域，for 循环的每一次迭代都会创建一个新的绑定，并把当次的值捕获进那个闭包，因此三个函数分别返回 0、1、2。E 是明显的错误说法，let 完全可以用在 for 循环里，这正是它相对 var 的改进之一。故选 A。"
    }
  ]
};
