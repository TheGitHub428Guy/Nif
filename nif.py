class Nif:
    def __init__(self, code, inputGen, outputMethod):
        #inputGen should be a generator function (called using func.send(something))
        #it should yield a 0 at first because python :/
        #outputMethod should just be a function (called using func(output))
        self.code = code
        self.ip = 0
        self.stack = []
        self.input = inputGen
        self.skipping = 0
        self.output = outputMethod
        next(self.input)
        """
        A skipping value of 0 means normal code execution (no skipping).
        >0 means skipping forward
        <0 means skipping backward
        """
    def pop(self, i=0):
        try: return self.stack.pop(i)
        except IndexError: return 0
    def mov(self, a, b):
        if b < len(self.stack): self.stack.insert(b, self.pop(a))
        else: self.pop(a)
    def step(self, skipSkipping:bool=True):
        if self.ip in range(0, len(self.code)):
            if self.skipping == 0:
                if self.code[self.ip] == "&": self.stack.insert(0, len(self.stack))
                elif self.code[self.ip] == "-": self.stack.insert(0, self.pop(1)-self.pop())
                elif self.code[self.ip] == "~":
                    m = self.pop()
                    if m == 0:
                        self.stack.insert(0, self.stack[0] if len(self.stack) > 0 else 0)
                    else:
                        self.mov(max(0, m), max(0, -m)) # :)
                elif self.code[self.ip] == "[":
                    if self.pop() <= 0: self.skipping += 1
                elif self.code[self.ip] == "]":
                    if self.pop() > 0: self.skipping -= 1
                elif self.code[self.ip] == ";":
                    m = self.pop()
                    if m >= 0: self.output(m)
                    else: self.stack.insert(0, self.input.send(m))
            else:
                if self.code[self.ip] == "[": self.skipping += 1
                elif self.code[self.ip] == "]": self.skipping -= 1
            self.ip += (-1 if self.skipping<0 else 1)
            if (self.skipping != 0) and skipSkipping: self.step()
            return True
        else: return False
    def run(self):
        while self.step(False): pass
def nifInput(multi=False):
    #multi: multiple input streams that can be read,
    #by calling ; with different negative numbers
    yield 0
    inp = {}
    while True:
        i = (yield) if multi else 0 #???
        if i not in inp: inp[i] = []
        if len(inp[i]) == 0:
            try: text = input()
            except EOFError: text = ""
            for t in text:
                inp[i] += [ord(t)]
        yield (inp[i].pop(0) if len(inp[i]) > 0 else 0) #nice
def preprocess(inp=""):
    yield 0
    for i in inp: yield ord(i)
    while True: yield 0
def printChars(char):
    try: print(chr(char), end="")
    except ValueError: print(chr(0xFFFD), end="")
if __name__ == "__main__":
    import argparse as arg
    parse = arg.ArgumentParser(description="")
    parse.add_argument("program", nargs="?", default="")
    parse.add_argument("input", nargs="?", default="")
    args = parse.parse_args()
    try: code = "".join(open(args.program, "r").readlines())
    except:
        code = []
        print("Enter code, then type END:\n", end="")
        while True:
            code += [input()]
            if code[-1] == "END":
                break
        code = "\n".join(code)
    try: inpt = preprocess("".join(open(args.input, "r").readlines()))
    except: inpt = nifInput()
    Nif(code, inpt, printChars).run()
