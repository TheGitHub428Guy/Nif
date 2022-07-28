# Nif v1.1
Nif is a stack-based programming language based on Knightfunge, an unreleased programming language based on [Befunge](https://esolangs.org/wiki/Befunge). Nif, however, does not look or work like Befunge.
### Why is it called Nif?
The name comes from the word for six sixes (36 in decimal) used in [this page about base six](https://www.seximal.net/). There are two reasons why I used it as the name:
 - It sounds cool
 - Nif has six commands, so it kinda fits
### Wait, only six commands?
Yep. Each command operates on the main (and only) method of data storage, a stack of integers.
Here are those six commands:
|Name|Character|Action
|-|-|-|
|len|`&`|Pushes the amount of numbers currently on the stack to the stack.|
|sub|`-`|Pops¹ two numbers (A then B) from the stack, then pushes B-A.|
|mov|`~`|Pops¹ a number N. If N==0, duplicates top of stack. If N>0, brings the number N below the top of stack to the top¹. If N<0, buries the top of stack abs(N) places down².|
|i/o|`;`|Pops¹ a number N, sends it to I/O, then pushes the result given by I/O to the stack. (See the I/O section for details.)|
|while|`[`|Pops¹ a number N, then jumps to the matching³ ] if N≤0.|
|end|`]`|Pops¹ a number N, then jumps back to the matching³ \[ if N>0.|

¹If a command tries to pop from an empty stack, or if ~ tries to bring from below the bottom of the stack (for example, using `&~`), it gets a 0.\
²If ~ tries to bury a number past the bottom of the stack, the number gets discarded instead.\
³If no matching bracket is found, program exits with an error.

All other characters are NOPs and can be used as comments (or decoration!).
### Alright here's how I/O works
An I/O method accepts a number as input, then after (maybe) doing some stuff with it, returns another number. Here's a basic I/O method that does text I/O:
|Send|Action|Return
|-|-|-
|any n ≥ 0|Output n as a Unicode character.|0
|any n < 0|Try to read 1 character of input.|that character's code point
#### Multi I/O
Multi I/O is a method used to combine multiple methods of I/O.
|Send|Action|Return
|-|-|-
|any n != 0|Send n to the selected I/O method.|whatever that method returns
|0, then any n != 0|Change selected I/O method to the one with ID n.|0, then 0 if the method exists, -1 if it doesn't
|0, then 0|Send 0 to the selected I/O method.|0, then whatever that method returns

Using undefined I/O methods does nothing and returns 0 lol\
Here is a list of the I/O methods used in the HTML interpreter's multi I/O:
##### 1 - Terminal I/O
Similar to the Text I/O example, but with the ability to get keypresses too.
Send|Action|Return
-|-|-
any n ≥ 0|Output n as a Unicode character.|0
-1|Read 1 character from stdin (line-buffered).|that character's code point
-2|Try to read 1 character* from the keypress queue (non-blocking).|that character's code point, or -1 if keypress queue is empty
any n ≤ -3|Nothing|0

*Some keypresses are counted as multiple characters, e.g. `\x1b[C` for the right arrow key. I might fix this later idk
### Examples
Here's what the (currently) shortest Hello, world! program in Nif (262 characters) looks like:\
```&&-&-&-&-&-&-&-&-&-&--&~~&&--&~~&~~&~&&-~-&&-~--&~~&~~&&--&&--&&--&~~&~&&-~--&~~;&~~-~&&&&---~&~&&-~--&&--&~~&-;&~~-~&&--&&--&~~;&~~-~;&~~-~&&--&&--&&--&~~;&~~-&&--&&--&&--~&-&-&-&-&-&&--&&--&~~;[&~]&-&-;&~~-~&~~&~&--;[&~];[&~]&&--&&--&&--;[&~];[&~]&-&-&[;[&~]&]```\
Other examples can be found in the `examples` folder.
