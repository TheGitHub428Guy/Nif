# Nif
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
|i/o|`;`|Pops¹ a number N, then outputs it³ if N≥0. Otherwise, gets a number from input³ and pushes it to the stack.|
|while|`[`|Pops¹ a number N, then jumps to the matching⁴ ] if N≤0.|
|end|`]`|Pops¹ a number N, then jumps back to the matching⁴ \[ if N>0.|

¹If a command tries to pop from an empty stack, or if ~ tries to bring from below the bottom of the stack (for example, using `&~`), it gets a 0.\
²If ~ tries to bury a number past the bottom of the stack, the number gets discarded instead.\
³Usually text I/O, but you could have a method for using different methods of I/O (for example, different negative values of N for different input methods)\
⁴Unmatched brackets cause undefined behavior (i.e. don't do it).

All other characters are NOPs and can be used as comments (or decoration!).
### Examples
Examples can be found in the `examples` folder
