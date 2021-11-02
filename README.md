# Nif v1.1
Nif is a stack-based programming language based on Knightfunge, an unreleased programming language based on [Befunge](https://esolangs.org/wiki/Befunge). Nif, however, does not look or work like Befunge.
### Why is it called Nif?
The name comes from the word for six sixes (36 in decimal) used in [this page about base six](https://www.seximal.net/). There are two reasons why I used it as the name:
 - It sounds cool
 - Nif has six commands, so it kinda fits
### Wait, only six commands?
Yep, here they are:
|Name|Character|Action|
|-|-|-|
|len|`&`|Pushes the amount of numbers currently on the stack to the stack.|
|sub|`-`|Pops¹ two numbers (A then B) from the stack, then pushes B-A.|
|mov|`~`|Pops¹ a number N. If N==0, duplicates top of stack. If N>0, brings the number N below the top of stack to the top¹. If N<0, buries the top of stack \|N\| places down².|
|i/o|`;`|Pops¹ a number N, sends it to I/O³, then pushes the result given to the stack.|
|while|`[`|Pops¹ a number N, then jumps to the matching⁴ ] if N≤0.|
|end|`]`|Pops¹ a number N, then jumps back to the matching⁴ \[ if N>0.|

¹If a command tries to pop from an empty stack, or if ~ tries to bring from below the bottom of the stack (for example, using `&~`), it gets a 0.\
²If ~ tries to bury a number past the bottom of the stack, the number gets discarded instead.\
³I/O starts out in text mode (mode #1);the mode can be switched by sending a 0, then the # of the mode you want to switch to. Sending two 0s in a row will just send a 0 to the current I/O method without switching.\
⁴Unmatched brackets cause undefined behavior (i.e. don't do it).

All other characters are NOPs and can be used as comments (or decoration!).
### I/O
Here is a list of the current I/O methods:
|Name|#|Description|
|-|-|-|
|Text|1|For console I/O. Sending any N ≥ 0 will convert N to a character, then output it to console. Sending any N < 0 will receive a character from console input, and return its character code.|
That's all for now. Using undefined I/O methods causes undefined behavior I guess idk
### Examples
Various examples can be found if the `examples` folder.