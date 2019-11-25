const {
  Parser,
  lazy,
  letter,
  digit,
  regex,
  regexA,
  letters,
  digits,
  err,
  str,
  sequenceOf,
  choice,
  many,
  optional,
  between,
  sepBy,
} = require('./parsers.js')
const fs = require('fs');

module.exports = (mccode, options = {fullError: false, noWhitelines: false}) => {
  const {fullError, noWhitelines} = options;

  const logicParser = (input, invert = false, inverted = false, options = {or: true, and: true, groups: true}) => {
    const orEnabled = options.or;
    const andEnabled = options.and;
    const groupsEnabled = options.groups;
    if(orEnabled === false && andEnabled === false) return input;
    let match;
    if(orEnabled && groupsEnabled && /(?:(?:(.+?)\s+\|\|\s+(!?)\((.+?)\))|(?:(!?)\((.+?)\)\s+\|\|\s+(.+)))(?!\))/.test(input)) {
      match = input.match(/(?:(?:(.+?)\s+\|\|\s+(!?)\((.+?)\))|(?:(!?)\((.+?)\)\s+\|\|\s+(.+)))(?!\))/);
      let invertChar = (match[2] || match[2] == '') ? match[2] : match[4];
      return {
        "type": "or",
        "inverted": invert ? !inverted : inverted,
        "conds": [logicParser(match[1] ? match[1] : match[5], (invertChar == "!" && match[5]), inverted, options), logicParser(match[3] ? match[3] : match[6], (invertChar == "!" && match[3]), inverted, options)]
      }
    } else if(andEnabled && groupsEnabled && /(?:(?:(.+?)\s+&&\s+(!?)\((.+?)\))|(?:(!?)\((.+?)\)\s+&&\s+(.+)))(?!\))/.test(input)) {
      match = input.match(/(?:(?:(.+?)\s+&&\s+(!?)\((.+?)\))|(?:(!?)\((.+?)\)\s+&&\s+(.+)))(?!\))/);
      let invertChar = (match[2] || match[2] == '') ? match[2] : match[4];
      return {
        "type": "and",
        "inverted": invert ? !inverted : inverted,
        "conds": [logicParser(match[1] ? match[1] : match[5], (invertChar == "!" && match[5]), inverted, options), logicParser(match[3] ? match[3] : match[6], (invertChar == "!" && match[3]), inverted, options)]
      }
    } else if(orEnabled && /\s\|\|\s/.test(input)) {
      match = input.match(/(.+?)\s+\|\|\s+(.+)/);
      if(groupsEnabled === false) {
        if(/^\(.+?\)$/.test(match[1])) match[1] = match[1].replace(/^\(/, '').replace(/\)$/, '');
        if(/^\(.+?\)$/.test(match[2])) match[2] = match[2].replace(/^\(/, '').replace(/\)$/, '');
      }
      let conds = [logicParser(match[1], false, inverted, options), logicParser(match[2], false, inverted, options)];
      if(/^\(/.test(conds[0]) && /\)$/.test(conds[1])) conds = [conds[0].replace(/^\(/, ''), conds[1].replace(/\)$/, '')]
      else if(/^!\(/.test(conds[0]) && /\)$/.test(conds[1])) conds = [conds[0].replace(/^!\(/, ''), conds[1].replace(/\)$/, '')]
      return {
        "type": "or",
        "inverted": invert ? (/!\(.+?\)/.test(input) ? inverted : !inverted) : (/!\(.+?\)/.test(input) ? !inverted : inverted),
        "conds": conds
      }
    } else if(andEnabled && /\s&&\s/.test(input)) {
      match = input.match(/(.+?)\s+&&\s+(.+)/);
      if(groupsEnabled === false) {
        if(/^\(.+?\)$/.test(match[1])) match[1] = match[1].replace(/^\(/, '').replace(/\)$/, '');
        if(/^\(.+?\)$/.test(match[2])) match[2] = match[2].replace(/^\(/, '').replace(/\)$/, '');
      }
      let conds = [logicParser(match[1], false, inverted, options), logicParser(match[2], false, inverted, options)];
      if(/^\(/.test(conds[0]) && /\)$/.test(conds[1])) conds = [conds[0].replace(/^\(/, ''), conds[1].replace(/\)$/, '')]
      else if(/^!\(/.test(conds[0]) && /\)$/.test(conds[1])) conds = [conds[0].replace(/^!\(/, ''), conds[1].replace(/\)$/, '')]
      return {
        "type": "and",
        "inverted": invert ? (/!\(.+?\)/.test(input) ? inverted : !inverted) : (/!\(.+?\)/.test(input) ? !inverted : inverted),
        "conds": conds
      }
    } else {
      if(/^!/.test(input) && invert) return input.replace(/^!/, '');
      if(!/^!/.test(input) && invert) return '!' + input;
      return input;
    }
  }

  function simpleOrParser(input, convert = false) {
    if(/\s\|\|\s/.test(input) || (convert && /\s&&\s/.test(input))) {
      if(convert == true) return flatten(logicParser(input.replace(/\s+&&\s+/, ' || '), false, false, {or: true, and: false, groups: false}).conds);
      return flatten(logicParser(input, false, false, {or: true, and: false, groups: false}).conds);
    } else {
      return input
    }


    function flatten(arr) {
      const returns = []
      if(typeof(arr) == "string") returns.push(arr);
      else if(Array.isArray(arr)) {
        for(let e of arr) {
          returns.push(...flatten(e))
        }
      }
      else if(typeof(arr) == "object") {
        returns.push(...flatten(arr.conds))
      }

      return returns;
    }
  }


  const whitespaceParser = regex("\\s+");
  const newLineParser = choice([str("\n"), str("\r\n")]);
  const manyNewLineParser = many(newLineParser).map(e => e.join(""));

  const debugCommentParser = sequenceOf([
    str("//"),
    regex(".*"),
  ]).map(e => {
    const returns = {
      type: "debugComment",
    }
    if(fullError) returns.args = e[1]
    return returns;
  });

  const commandParser = sequenceOf([
    str("/"),
    regex(".*"),
  ]).map(e => e[1]);
  const commentParser = sequenceOf([
    str("#"),
    regex(".*"),
  ]).map(e => e.join(""));


  const elseParser = lazy(() => choice([
    sequenceOf([
      regex("else\\s*\\{\\n*"),
      optional(nodesParser),
      regex("\\}")
    ]).map(e => e[1]),
    sequenceOf([
      regex("else\\s+"),
      ifParser,
    ]).map(e => [e[1]]),
    sequenceOf([
      regex("else\\s+"),
      commandParser,
    ]).map(e => [e[1]]),

  ]))

  const ifParser = lazy(() => choice([
    sequenceOf([
      regexA("if\\((.+?)\\),\\s+(?!(?:\\|\\|)|(?:&&))"),
      nodeParser
    ]).map(e => ({
      type: "if",
      args: logicParser(e[0][1]),
      nodes: e[1]
    })),
    sequenceOf([
      regexA("if\\((.+?)\\)\\s*\\{\\n?"),
      optional(nodesParser),
      regex("\\}\\n*\\s*"),
      elseParser,
    ]).map(e => {
      let result = [
        {
          type: "if",
          args: logicParser(e[0][1]),
          nodes: e[1],
        }
      ]
      if(e[3]) result.push({
          type: "if",
          args: logicParser(e[0][1], true, false),
          nodes: e[3],
        })
      return result
    }),
    sequenceOf([
      regexA("if\\((.+?)\\)\\s*\\{\\n*"),
      optional(nodesParser),
      regex("\\}")
    ]).map(e => ({
        type: "if",
        args: logicParser(e[0][1]),
        nodes: e[1],
      })),
    sequenceOf([
      regexA("if\\((.+?)\\)\\s+(?!(?:\\|\\|)|(?:&&))"),
      commandParser,
      newLineParser,
      elseParser,
    ]).map(e => {
      let result = [
        {
          type: "if",
          args: logicParser(e[0][1]),
          nodes: [e[1]],
        }
      ]
      if(e[3]) result.push({
          type: "if",
          args: logicParser(e[0][1], true, false),
          nodes: e[3],
        })
      return result
    }),
    sequenceOf([
      regexA("if\\((.+?)\\)\\s+(?!(?:\\|\\|)|(?:&&))"),
      commandParser,
      newLineParser,
    ]).map(e => ({
      type: "if",
      args: logicParser(e[0][1]),
      nodes: [e[1]]
    })),
  ]))


  const generalNodeParser = lazy(() =>
    choice([
      sequenceOf([
        regexA("(\\w+)\\((.+?)\\),\\s*(?!\\|\\|)"),
        nodeParser,
      ]).map(e => ({
        type: e[0][1],
        args: simpleOrParser(e[0][2], true),
        nodes: e[1],
      })),
      sequenceOf([
        regexA("(\\w+)\\((.+?)\\)\\s+(?!\\|\\|)\\{"),
        optional(nodesParser),
        regex("\\}\\n*\\s*"),
      ]).map(e => ({
        type: e[0][1],
        args: simpleOrParser(e[0][2], true),
        nodes: e[1],
      })),
      sequenceOf([
        regexA("(\\w+)\\((.+?)\\)\\s+(?!\\|\\|)"),
        commandParser
      ]).map(e => ({
        type: e[0][1],
        args: simpleOrParser(e[0][2], true),
        nodes: e[1],
      })),
    ])
  );


  const logParser = regexA("log\\((.+?)\\)").map(e => `tellraw @a[gamemode=!survival, gamemode=!adventure] [{"text":"[Console] ","color":"dark_purple","hoverEvent":{"action":"show_text","value":[{"text":"Logged from the console"}]}},{"text":"${e[1]}","color":"reset"}]`)



  const nodeParser = sequenceOf([
    optional(whitespaceParser.map(e => {
      let length;
      if(/\r\n/.test(e)) length = e.split("\r\n").length - 2;
      const result = [];
      for(let i = 0; i < length; i++) {
        result.push({type: "newline"})
      }
      return result
    })),
    choice([
      debugCommentParser,
      commandParser,
      commentParser,
      ifParser,

      generalNodeParser,

      logParser,
    ]),
    optional(manyNewLineParser.map(e => {
      let length;
      if(/\r\n/.test(e)) length = e.split("\r\n").length - 2;
      const result = [];
      for(let i = 0; i < length; i++) {
        result.push({type: "newline"})
      }
      return result
    })),
  ]).map(e => {
    const returns = [];
    if(Array.isArray(e[0]) && noWhitelines == false) returns.push(...e[0]);
    if(Array.isArray(e[1])) returns.push(...e[1]);
    else returns.push(e[1])
    if(Array.isArray(e[2]) && noWhitelines == false) returns.push(...e[2]);
    return returns
  });

  const nodesParser = many(nodeParser).map(e => {
    let result = [];
    for(let ee of e) {
      for(let eee of ee) {
        result.push(eee);
      }
    }
    return result;
  });


  const fileParser = sequenceOf([
    sequenceOf([
      str("!file:"),
      optional(whitespaceParser),
      regex(".+"),
    ]).map(e => e[2]),
    optional(manyNewLineParser),
    optional(sequenceOf([
      str("!type:"),
      optional(whitespaceParser),
      regex(".+"),
    ]).map(e => e[2])),
    optional(manyNewLineParser),
    optional(nodesParser)
  ])

  const mainParser = many(sequenceOf([
    optional(manyNewLineParser),
    fileParser,
  ])).map(e => {
    // console.log(e[0][1]);
    let result = [];

    for(let ee of e) {
      let file = {};

      file.path = ee[1][0];
      file.type = ee[1][2] ? ee[1][2] : 'mcfunction';
      file.nodes = ee[1][4] ? ee[1][4] : [];


      result.push(file)
    }

    return result;
  }).errorMap(e => {
    if(e == 'many: unable to match with parser at least once at index 0') return 'No file path specified'
    return e;
  })

  return mainParser.run(mccode)

}
