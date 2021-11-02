class Nif:
    def __init__(self, code, io):
        #io should be a generator function (called using func.send(something))
        #it should yield a 0 at first because python :/
        self.code = code
        self.ip = 0
        self.stack = []
        self.io = io
        self.skipping = 0
        next(self.io)
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
                    self.stack.insert(0, self.io.send(self.pop()))
            else:
                if self.code[self.ip] == "[": self.skipping += 1
                elif self.code[self.ip] == "]": self.skipping -= 1
            self.ip += (-1 if self.skipping<0 else 1)
            if (self.skipping != 0) and skipSkipping: self.step()
            return True
        else: return False
    def run(self):
        while self.step(False): pass
def textIO():
    y = 0
    inp = []
    while True:
        i = yield y
        if i == -1:
            if len(inp) == 0:
                try: text = input()
                except EOFError: text = ""
                for t in text:
                    inp += [ord(t)]
            y = (inp[i].pop(0) if len(inp[i]) > 0 else 0)
        elif i>=0:
            try:
                print(chr(i), end="")
                y=0
            except ValueError:
                print(chr(0xFFFD), end="")
                y=0
def nifIO(methods):
    #methods: dictionary of {method ID: generator}
    #once again the methods should yield a 0 at first PYTHON AFJKcfhjd
    y = 0
    methode = 1
    mode = False
    for i in methods:
        next(methods[i])
    while True:
        i = yield y
        if mode:
            if i == 0: y=methods[methode].send(0)
            else: methode = i
            mode = False
        else:
            y=0
            if i == 0: mode = True
            else: y=methods[methode].send(i)
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
            if code[-1] == "END": break
        code = "\n".join(code)
    io = nifIO({1: textIO()})
    Nif(code, io).run()
