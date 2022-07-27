//browserify :heart:
const $ = require("jquery");
const {Terminal} = require("xterm");
const {Readline} = require("xterm-readline"); //thank goodness this works
const {FitAddon} = require("xterm-addon-fit");
const Split = require("split.js");
//no shorthand variables. we goin full verbose mode (lie)
//Math.max doesn't work with BigInts so here's a substitute
max=(...x)=>{return x.sort((a,b)=>(a<b)?1:((a>b)?-1:0))[0]};
class Nif {
	//i coded the original interpreter in python. cool!
	constructor (c, io) {
		//io should be an object with a method called _
		//which takes 1 argument (a number) and returns a number (while most likely doing i/o in the process)
		this.c=c??""; //code (uses an empty string if no code found lol)
		this.p=0; //instecjron pointer
		this.s=[];//stack
		this.io=io??{"_":(a)=>{return 0n},"del":()=>{delete this}}; //input & output method (if none found, uses a placeholder)
		this.d=0; //ip direction; 0=normal, >0=jumping forward, <0=jumping back
		this.steps=0; //total steps in the program (without NOPs)
		this.b=undefined; //bracket hit before skipping, used to locate an unmatched bracket
		this.pr=null; //a promise if waiting for input
	}
	mov (a,b){
		let x=this.s.splice(Number(a),1)[0]??0n;
		if(b<=this.s.length){this.s.splice(Number(b),0,x)}
	}
	async step () {
		if (this.pr != null) {
			return(-1)
		}
		if (this.d!=0) {
			switch(this.c[this.p]){
				case undefined: //past end of code or before beginning of code, can only be caused by unmatched brackets
					return(2);
					break;
				case"[":this.d++;break;
				case"]":this.d--;break;
			}
		} else {
			let x=0; //let me declare variables in case statementns please
			let y=0; //a
			switch(this.c[this.p]){
				case undefined: //past end of code, program finished
					return(1);
					break; //wait i don't think i need this
				case"&":
					this.s.unshift(BigInt(this.s.length));
					break;
				case"-":
					this.s.unshift(-(this.s.shift()??0n)+(this.s.shift()??0n));
					break;
				case"~":
					{x=this.s.shift()??0n;
					if(x==0n){this.s.unshift(this.s[0]??0n)}
					else{this.mov(max(0n,x), max(0n,-x))};
					break;}
				case";":
					this.s.unshift(BigInt(await (this.pr = this.io._(this.s.shift()??0n))));
					this.pr = null;
					break;
				case"[":
					if((this.s.shift()??0)<1n){this.d++;this.b=this.p};
					break;
				case"]":
					if((this.s.shift()??0)>0n){this.d--;this.b=this.p};
					break;
				default: this.steps--
			}
			this.steps++; //b
		}
		this.p+=(this.d<0)?-1:1; //i like this line
		return(0)
	}
}
//can i have a class for input and output?
class NullIO { //for input and output?
	//yes
	constructor(){
		//...
	}
	//send     | action     | return
	//---------+------------+-------
	//whatever | don't care | 0
	_(n){return 0n;} //actually does nothing like a boss
	del(){ //refuses to elaborate further
		delete this //dies
	}
}
class MultiIO {
	//Used to combine multiple methods of IO.
	//state     | send | action                                      | return
	//----------+------+---------------------------------------------+-----------------------------
	//normal    | n!=0 | send n to current IO mode                   | whatever the IO mode returns
	//normal    | 0    | set state to switching                      | 0
	//switching | n!=0 | switch current IO mode to n*                | 0 if IO mode exists, -1 if not
	//switching | 0    | cancel switch and send 0 to current IO mode | whatever the IO mode returns
	//*if no mode with ID n, make a new NullIO and switch to that
	constructor(m){
		//m should be an object of valid IO methods
		//in the format {non-zero number: method, non-zero number: method, ...}
		this.m=m;
		this.c=1n; //current IO mode (starts at 1n)
		this.s=false; //s: whether MultiIO is in switching mode
	}
	_(n){
		if (this.s) { //if about to switch modes, then
			this.s=false; //stop switching
			if(n==0){return(this.m[this.c]._(0n)??0n)}
			else{this.c=n;if(this.m[this.c]==undefined){this.m[this.c]=new NullIO();return(-1n)}};
		} else {
			if(n==0){this.s=true;}
			else{return(this.m[this.c]._(n)??0n)}
		}
		return(0n)
	}
	del(){
		for(let i in this.m){this.m[i].del()};
		delete this
	}
}
class TextIO {
	//just some real simple text I/O. stuff is input with a textarea element and output to another one. uses jquery
	//send | action                      | return
	//-----+-----------------------------+-------------------
	//>=0  | x -> output char code x     | 0
	//<0   | get 1 char from input* -> y | y's character code
	//*if input is empty, returns 0
	constructor(i,o) {
		this.i=$(i);
		this.o=$(o);
	}
	_(n){
		if(n<0){
			return([
				this.i.val().length?this.i.val().charCodeAt(0):0,
				this.i.val(this.i.val().substr(1))
			][0]) //trust me i know what i'm doing
		}else{
			this.o.html(
				this.o.html()
				+this.o.text(String.fromCharCode(Number(n))).html()
			);
			return(0)
		}
		return(0) //wait why is this here
	}
	del(){
		delete this //don't care
	}
}
class TermIO {
	//some pretty epic terminal I/O tbh. input and output is done with an xterm terminal object. requires readline addon too
	//send | action                                | return
	//-----+---------------------------------------+-------------------
	//>=0  | x -> output char code x               | 0
	//-1   | get 1 char from input queue* -> y     | y's character code
	//-2   | get 1 char from keypress queue** -> z | z's character code
	//<=-3 | whatever                              | 0
	//*if input queue is empty, will get 1 line of input
	//  -1 if end of input somehow (will be useful when i eventually probably maybe add preprocessed input)
	//**keypresses are only detected when line input is not happening.
	//  some keypresses are represented with escape codes which contain multiple characters (e.g. right arrow key -> "\x1b[C")
	//    these will be returned 1 char at a time. if this causes any issues just let me know or something
	//  if key queue is empty, returns -1
	constructor(_T, RL){
		this.T=_T;this.I=[];this.K=[]; //this.T = the terminal object, this.I = standard input, this.K = queue of keys pressed
		this.RL=RL; //readline addon :)
		this.L=false; //true if waiting for line input
		this.EL = this.T.onKey(K=>{if(!this.L)this.K.push(...K.key)}) //event listener
	}
	async _(N){
		return((N>=0)?(
			this.T.write(String.fromCodePoint(Number(N))),
			0
		):(N==-2)?(
			this.K.length ? this.K.shift().codePointAt(0) : -1
		):(N==-1)?(
			this.L=true,
			!this.I.length ? (this.I.push(...await this.RL.read([
				this.T.selectLines(this.T.buffer.active.cursorY, this.T.buffer.active.cursorY),
				this.T.getSelection(),
				this.T.select(this.T.buffer.active.cursorX, this.T.buffer.active.cursorY, 0)][1]), "\n")) : 0,
			this.L=false,
			this.I.length ? this.I.shift().codePointAt(0) : -1
		):(
			0
		))
	}
	del(){
		this.EL.dispose()
		this.RL.activeRead = undefined; //cancel potential line input
		delete this
	}
}
$(async function(){ //mfw need async function
	playing=0; //0 = stopped, 1 = playing, -1 = paused
	nif=undefined;
	sVertical=true;
	term=new Terminal({cursorBlink:"block",convertEol:true});
	term.open($("#b")[0]);
	fit=new FitAddon();
	rl=new Readline();
	term.loadAddon(fit);
	term.loadAddon(rl);
	waitFrame=()=>new Promise((resolve,reject)=>requestAnimationFrame(resolve)); //sweet
	updateDebug=()=>{
		if(nif!=undefined){
			$("#s").html(
					$("#s").text("Steps: "+stackBase(nif.steps)).html()
					+$("#s").text((nif.d)?` (Jumping ${(nif.d>0)?"for":"back"}wards [${Math.abs(nif.d)}])`:"").html() //oh dear
					+sV[$("#stackView").val()]([...nif.s].reverse())
			);
		}
	};
	sV = { //stack views
	pre: l=>(`\nStack (${stackBase(l)}):`),
	num: s=>($("#s").text(`${sV.pre(s.length)} ${s.map(stackBase).join(" ")}`).html()),
	str: s=>(`${sV.pre(s.length)} <span style="word-break: break-all">`+s.map(stack2String).join``+"</span>"),
	vrt: s=>(`${sV.pre(s.length)}`+s.map(h=>(`\n${stackBase(h)} (${stack2String(h)})`)).join``), //i should probably clean this up a bit
	non: s=>"",
	};
	stack2String = (a)=>(
		(a<0)?
			(`<negative>${stack2String(-a)}<\/negative>`)
		:(a<0x20)?
			(`<low>${"0123456789ABCDEF\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079abcdef"[Number(a)]}<\/low>`)
		:(a==0x20)?
			("<x20>\u2219</x20>")
		:(a<0x7f)?
			$("#s").text(String.fromCharCode(Number(a))).html()
		:(a<0xa1)?
			(`<x20>${$("#s").text(String.fromCharCode(Number(a-0x40n))).html()}<\/x20>`)
		:(a==0xad)?
			("<x20>-</x20>")
		:(a==0x2de)?
			("\u02DE ")
		:(a<0x300)?
			$("#s").text(String.fromCharCode(Number(a))).html()
		:(a<0x10000)?
			$("#s").text(String.fromCharCode(Number(a))).html()
		:
			"\uDBFF\uDFFE"
	)
	stackBase=x=>x.toString(sBase=$("#stackBase").val())/*.replace(/[\d.a-f]+/g,a=>({16:"0x", 10:"", 6:"0s"}[sBase])+a)*/;
	step = async ()=>{ //omg async arrow function!!!! <3
		keepGoing=1;
		if (nif==undefined) {
			nif=new Nif($("#e").val(), new MultiIO({1: new TermIO(term, rl)}));
			term.write("\n\r\x1b[0;30;43m===PROGRAM START===\x1b[0m\n\r");
		}else{
			$("#step,#play").attr("disabled", true);
			stepsLeft = Math.min(+($("#spf").val()), +($("#spf").attr("max")))
			while (stepsLeft > 0) {
				do { //an actually useful do...while loop? wild
					x=await nif.step();
				} while (
					((!($("#jumpToggle").is(":checked")) && nif.d)
					|| (!($("#nopToggle").is(":checked")) && !("&-~;[]".includes(nif.c[nif.p])))
					|| nif.c[nif.p] == "\n")
					&& nif.c[nif.p] != undefined
				);
				stepsLeft--;
			}
			if(x>0) {
				keepGoing=0;
				$("#step,#play").attr("disabled", true);
				$("#play").text("Play");
				playing=-2;
				term.write("\n\r\x1b[0;37;4"+((x==2)?"1m===PROGRAM ERROR":"4m====PROGRAM END=")+"===\x1b[0m\n\r");
				(x==2)&&term.write("Unmatched brackets"); // Shut Up
				nif.io.del()
			} else {
				$("#play").attr("disabled", false);
				$("#step").attr("disabled", (playing!=-1));
			}
		};
		$("#r").html(
			(nif.d==0)?(
				$("#r").text($("#e").val().substr(0,nif.p)).html()
				+ "<mark>"
				+ $("#r").text($("#e").val().substr(nif.p,1)).html()
				+ "</mark>"
				+ $("#r").text($("#e").val().substr(nif.p+1)).html() //this feels unnecessary...
			):(nif.p in [...nif.c])?(
				((X,P,B)=>(
				$("#r").text(X.substr(0,(S=[P,B].sort((a,b)=>a-b))[0])).html()
				+"<mark"+("b "[Z=+(P>B)])+">"
				+$("#r").text(X[S[0]]).html()
				+"</mark"+"b "[Z]+">"
				+$("#r").text(X.substr(S[0]+1,S[1]+~S[0])).html()
				+"<mark"+" b"[Z]+">"
				+$("#r").text(X[S[1]]).html()
				+"</mark"+" b"[Z]+">"
				+$("#r").text(X.substr(S[1]+1)).html()
				))($("#e").val(),nif.p,nif.b) //okay that's enough
			):(
				$("#r").text($("#e").val().substr(0,nif.b)).html()
				+ "<markc>"
				+ $("#r").text($("#e").val().substr(nif.b,1)).html()
				+ "</markc>"
				+ $("#r").text($("#e").val().substr(nif.b+1)).html() //make a function gosh dang it
			)
		);
		updateDebug();
		$("#r").show();
		$("#e").hide();
		return(keepGoing);
	};
	playLoop = async ()=>{
		if (await step()){
			if($("#vsync").is(":checked")){await waitFrame()};
			if(playing==1){playF = setTimeout(playLoop, $("#speed").val());}
		}
	};
	$("#play").on("click", ()=>{
		if(playing>0){
			clearTimeout(playF);
			$("#stop,#step").attr("disabled", false); //nice
			$("#play").text("Play");
			playing=-1;
		}else{
			playF = setTimeout(playLoop, $("#speed").val());
			$("#stop").attr("disabled", false);
			$("#step").attr("disabled", true);
			$("#play").text("Pause");
			playing=1;
		};
	})
	$("#step").on("click", ()=>{
		step();
		$("#stop").attr("disabled", false);
		playing = -1;
	});
	$("#stop").on("click", ()=>{
		$("#r").hide();
		$("#e").show();
		if (playing>0) {
			clearTimeout(playF);
			$("#play").text("Play");
		};
		if (typeof nif.c[nif.p] == "string"){
			term.write("\n\r\x1b[0;30;46m==PROGRAM STOPPED==\x1b[0m\n\r");
		}
		$("#step,#play").attr("disabled", false);
		$("#stop").attr("disabled", true);
		nif.io.del();
		nif = undefined;
		playing = 0;
	});
	mainSplit = Split(["#a","#b"], {gutterSize: 5});
	a1Split = Split(["#s","#a11"], {gutterSize: 5, direction:"horizontal", minSize:10, snapOffset:10, sizes:[20,80]});
	//bSplit = Split(["#o","#i"], {gutterSize: 5, direction:"vertical", minSize:10, snapOffset:10, sizes:[80,20]}); //haha no
	$("#speed").on("input", ()=>{$("#speedText").text(`Delay: ${$("#speed").val()}ms `)}) //thats good
	$("#stackView").on("change", ()=>{
		if(($("#stackView").val() == "vrt")!=sVertical){
			sVertical = ($("#stackView").val() == "vrt");
			a1Split.destroy();
			$("#a1").css("flex-direction",["column","row"][+sVertical]); //alright that's good
			$("#s")[["before","after"][+sVertical]]($("#a11")); //that's... good
			a1Split = Split(["#a11","#s"][["valueOf","reverse"][+sVertical]](), { //okay alright. alright that's good
				gutterSize: 5,
				direction:["vertical","horizontal"][+sVertical],
				minSize:10,
				snapOffset:10,
				sizes:[80,20][["valueOf","reverse"][+sVertical]]() //okay calm down
			});
		}
		updateDebug()
	})
	$("#stackBase").on("change", updateDebug);
	(O=new ResizeObserver(()=>fit.fit())).observe($("#b")[0]);
	$("#xfs").on("change", ()=>{
		term.setOption("fontSize", Math.max(+($("#xfs").val()), 2)); //if you set the font size to 1 it will freeze the tab. this is for your own good
		fit.fit()
	});
	$("#loading").hide();
});