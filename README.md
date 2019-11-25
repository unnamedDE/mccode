# MCCode

MCCode is a cli for generating mcfunction files from so-called ".mccode" files for Minecraft.

It adds three commands to the command line:

`mccode generate PACKNAME`: It will generate a template datapack.<br>
`mccode compile PATH`: It will compile all files in the specified folder. PATH default is `./`.<br>
`mccode watch PATH`: It will compile all files in the specified folder. PATH default is `./`.

--------------------------------------------------------------------------------

Every file has to start with "!file: PATH" where PATH has to be replaced with a relative path for the new file.

Commands have to start with a "/". There are also some useful shortcuts like `log(TEXT)` where TEXT will be sent to every creative and spectator player in a fancy way, rather than `say TEXT`. For every execute "sub-command" like `execute as` except "store" there is a shortcut:

```mccode
!file: ./greet

as(@p) {
  /say hi
  /say hello
}
```

will result to `execute as @p run say hi` and `execute as @p run say hello`. You can also seperate multiple arguments with `||` like this: `asat(@p || @e[limit=1]) /say @s` which will result in:

```mcfunction
execute as @p at @s run say @s
execute as @e[limit=1] run say @s
```

--------------------------------------------------------------------------------

The if statement is a little bit more advanced:

- conditions can be seperated with `||` to choose between one
- conditions can be seperated with `&&` to require both
- conditions can be inverted with `!` to form a unless command
- conditions can be grouped with `()`
- the if statement can be followed by a else statement

```mccode
if(entity @e || entity @p) /say hi

if(entity @p && entity @r) {
  /say hello
}

if(!entity @a) /say nobody online

if(entity @p[distance=..10]) /say nearby player
else /say no nearby player
```

```mcfunction
execute if entity @e run say hi
execute if entity @p run say hi

execute if entity @p if entity @r run say hello

execute unless entity @a run say nobody online

execute if entity @p[distance=..10] run say nearby player
execute unless entity @p[distance=..10] run say no nearby player
```

--------------------------------------------------------------------------------

A file can containt data for multiple mcfunctions to generate:

```mccode
!file: ./hello
/say hello

!file: ./hi
/say hi
```

This will generate two seperate files.

--------------------------------------------------------------------------------

If you found a bug or have any suggestions, please join my [discord](https://unnamedDE.tk/discord/).
