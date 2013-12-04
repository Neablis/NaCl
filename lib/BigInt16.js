var BigInt16 = function () {
    this.digits = [];
    this.sign = 1;
    if(!arguments) return;
    var arg = arguments[0];
    if (arg) {
        var typeString = Object.prototype.toString.call(arg);
        if (typeString === "[object Array]") {
            this.digits = arg;
        } else if (typeString === "[object Number]") {
            if (arg < 0) this.sign = -1;
            arg = Math.round(Math.abs(arg));
            while (arg) {
                this.digits.push( arg % 0x10000); //keep this a float if we can
                arg = Math.floor(arg / 0x10000);
            }
        } else if (typeString === "[object String]") {
            if (arg.match(/^0[xX]/)) {
                arg = arg.slice(2);
                while(arg.length) {
                    this.digits.push(parseInt(arg.slice(-4), 16));
                    arg = arg.slice(0, -4);
                }
                return;
            }
            if (arg.charAt(0) === "-") {
                this.sign = -1;
                arg = arg.slice(1);
            }
            for (var i = 0; i < arg.length; i++) {
                var multiplier = 1;//10;
                var digit = "";//arg.charAt(i);
                for(var j = 0; j < 14 && i + j < arg.length; j++) {
                    digit += arg.charAt(i + j);
                    multiplier *= 10;
                }
                i += j - 1;
                this.multiplyAndSet(new BigInt16(multiplier));
                this.addAndSet(new BigInt16(parseInt(digit)));
            }
        }
    }
};


BigInt16.prototype.clone = function () {
    var output = new BigInt16();
    output.digits = this.digits.slice(0);
    output.sign = this.sign;
    return output;
};

BigInt16.prototype.set = function (n) {
    this.digits = n.digits.slice(0);
    this.sign = n.sign;
    return this;
}


BigInt16.prototype.toString = function () {
    var output = "";
    for (var i = 0; i < this.digits.length; i++) {
        var str = this.digits[i].toString(16);
        while (str.length < 4) str = "0" + str;
        output = str + output;
    }
    if (this.sign === -1) output = "-" + output;
    return output;
};

BigInt16.prototype.compare = function (n, ignoreSign) {
    if (!ignoreSign) {
        if (this.sign > n.sign) return 1;
        if (this.sign < n.sign) return -1;
    }
    if (this.digits.length > n.digits.length) return 1;
    if (this.digits.length < n.digits.length) return -1;
    for (var i = this.digits.length - 1; i >= 0; i--) {
        if (this.digits[i] > n.digits[i]) return 1;
        if (this.digits[i] < n.digits[i]) return -1;
    }
    return 0;
};

BigInt16.prototype.gt = function (n) { return this.compare(n) === 1};
BigInt16.prototype.ge = function (n) { return this.compare(n) >= 0};
BigInt16.prototype.lt = function (n) { return this.compare(n) === -1};
BigInt16.prototype.le = function (n) { return this.compare(n) <= 0};
BigInt16.prototype.eq = function (n) { return this.compare(n) === 0};
BigInt16.prototype.ne = function (n) { return this.compare(n) !== 0};

BigInt16.prototype.addAndSet = function (n) {
    var carry = 0;
    if(this.sign == n.sign) {
        var maxDigits = Math.max(this.digits.length, n.digits.length);
        for (var i = 0; i < maxDigits; i++) {
            var augend = this.digits[i] || 0;
            var addend = n.digits[i] || 0;
            var sum = augend + addend + carry;
            carry = sum >>> 16;
            this.digits[i] = sum & 0xffff;
        }
        if (carry) {
            this.digits.push(carry);
        }
    } else {
        var difference;
        if(this.gt(n)) {
            difference = _subtractFromPositive(this, n);
        } else {
            difference = _subtractFromPositive(n, this);
            difference.sign = n.sign;
        }
        this.set(difference);
    }
    return this;
};

function _subtractFromPositive(minuend, subtrahend) {
    var output = minuend.clone();
    output.sign = 1;
    for (var i = subtrahend.digits.length - 1; i >= 0; i--) {
        if (minuend.digits[i] >= subtrahend.digits[i]) {
            output.digits[i] = minuend.digits[i] - subtrahend.digits[i];
        } else {
            output.digits[i] = 0x10000 + minuend.digits[i] - subtrahend.digits[i];
            for( var j = i + 1; output.digits[j] === 0; j++) {
                output.digits[j] = 0xffff;
            }
            output.digits[j] = output.digits[j] - 1;
        }
    }
    while(output.digits[output.digits.length - 1] === 0) {
        output.digits.pop();
    }
    return output;
}

BigInt16.prototype.add = function (n) {
    var output = this.clone();
    return output.addAndSet(n);
};

BigInt16.prototype.subtractAndSet = function (n) {
    var subtrahend = n.clone();
    subtrahend.sign = -subtrahend.sign;
    return this.addAndSet(subtrahend);
};

BigInt16.prototype.subtract = function (n) {
    var output = this.clone();
    var subtrahend = n.clone();
    subtrahend.sign = -subtrahend.sign;
    return output.addAndSet(subtrahend);
};

BigInt16.prototype.leftShiftAndSet = function (n) {
    var microshift = n % 16;
    if (microshift) {
        var carry = 0;
        for(var i = 0; i < this.digits.length; i++) {
            var result = this.digits[i] << microshift | carry;
            carry = result >>> 16;
            this.digits[i] = result & 0xffff;
        }
    }
    var macroshift = n >>> 4;
    for (var i = 0; i < macroshift; i++) {
        this.digits.unshift(0);
    }
    if (carry) {
        this.digits.push(carry);
    }
    return this;
}

BigInt16.prototype.leftShift = function (n) {
    var output = this.clone();
    output.leftShiftAndSet(n);
    return output;
};


BigInt16.prototype.rightShiftAndSet = function (n) {
    var macroshift = n >>> 4;
    this.digits = this.digits.slice(macroshift);
    var microshift = n % 16;
    var inverseMicroShift = 16 - microshift;
    if (microshift) {
        var carry = 0;
        for(var i = this.digits.length - 1; i >= 0; i--) {
            var result = this.digits[i] >>> microshift | carry;
            carry = (this.digits[i] << inverseMicroShift) & 0xffff;
            this.digits[i] = result;
        }
    }
    while(this.digits[this.digits.length - 1] === 0) {
        this.digits.pop();
    }
    return this;
}

BigInt16.prototype.multiply = function (n) {
    var output = new BigInt16();
    output.sign = this.sign * n.sign;
    for (var i = 0; i < this.digits.length; i++) {
        var multiplicand = this.digits[i];
        for (var j = 0; j < n.digits.length; j++) {
            var product = new BigInt16(multiplicand * n.digits[j]);
            product.leftShiftAndSet((i + j) * 16);
            output.addAndSet(product);
        }
    }
    return output;
}

BigInt16.prototype.multiplyAndSet = function (n) {
    return this.set(this.multiply(n));
};

BigInt16.prototype.divide = function (n) {
    return _divAndMod(this, n)[0];
};

BigInt16.prototype.divideAndSet = function (n) {
    return this.set(this.divide(n));
};

BigInt16.prototype.mod = function (n) {
    return _divAndMod(this, n)[1];
};

BigInt16.prototype.modAndSet = function (n) {
    return this.set(this.mod(n));
};


function _divAndMod (dividend, divisor) {
    var quotient = new BigInt16();
    var remainder = dividend.clone();
    while(remainder.ge(divisor)) {
        var offset = 16 * Math.max(remainder.digits.length - divisor.digits.length - 1, 0);
        var lastShift;
        var shifted = divisor.leftShift(offset);
        do {
            offset++;
            lastShift = shifted;
            shifted = divisor.leftShift(offset);
            var nextShift = divisor.leftShift(offset);
        } while (remainder.ge(shifted));
        offset--;
        remainder.subtractAndSet(lastShift);
        quotient.addAndSet((new BigInt16(1)).leftShift(offset));
    }
    return [quotient, remainder];
};

BigInt16.prototype.aToBModC = function(exponent, divisor) {
    exponent = exponent.clone();
    var power = this.clone();
    var result =  new BigInt16(1);
    while(exponent.digits.length) {
        if(exponent.digits[0] % 2) {
            result.multiplyAndSet(power).modAndSet(divisor);
        }
        power.multiplyAndSet(power).modAndSet(divisor);
        exponent.rightShiftAndSet(1);
    }
    return result;
};


var assert = require('assert');
assert.equal()
assert.equal("0020000000000000", (new BigInt16(9007199254740992)).toString());
assert.equal("0020000000000000", (new BigInt16("9007199254740992")).toString());
assert.equal("0004df72d07b4b71c8dacb6cffa954f8d88254b6277099308baf003fab73227f34029643b5a263f66e0d3c3fa297ef71755efd53b8fb6cb812c6bbf7bcf179298bd9947c4c8b14324140a2c0f5fad7958a69050a987a6096e9f055fb38edf0c5889eca4a0cfa99b45fbdeee4c696b328ddceae4723945901ec025076b12b", new BigInt16("203956878356401977405765866929034577280193993314348263094772646453283062722701277632936616063144088173312372882677123879538709400158306567338328279154499698366071906766440037074217117805690872792848149112022286332144876183376326512083574821647933992961249917319836219304274280243803104015000563790123").toString());
assert.equal("000cb50e82a8583f44ee0025942e7362991b24e12663a0ddc234a57b0f7b4ff7b025bf5a6707dedc2898e70b739042c95a996283dffdf67558768784553c61e302e8812bc90f0bb0696870cfb910b560cefed8d99bbf7a00b31ccdbd56f3594e5a653cfd127d2167b13119e5c45c3f76b4e3d904a9bc0cbb43c33aa7f23b", new BigInt16("531872289054204184185084734375133399408303613982130856645299464930952178606045848877129147820387996428175564228204785846141207532462936339834139412401975338705794646595487324365194792822189473092273993580587964571659678084484152603881094176995594813302284232006001752128168901293560051833646881436219").toString());

//random 300 digit primes
//var p1 = new BigInt16("531872289054204184185084734375133399408303613982130856645299464930952178606045848877129147820387996428175564228204785846141207532462936339834139412401975338705794646595487324365194792822189473092273993580587964571659678084484152603881094176995594813302284232006001752128168901293560051833646881436219");
//var p2 = new BigInt16("203956878356401977405765866929034577280193993314348263094772646453283062722701277632936616063144088173312372882677123879538709400158306567338328279154499698366071906766440037074217117805690872792848149112022286332144876183376326512083574821647933992961249917319836219304274280243803104015000563790123");
var p1 = new BigInt16("2074722246773485207821695222107608587480996474721117292752992589912196684750549658310084416732550077");
var p2 = new BigInt16("2367495770217142995264827948666809233066409497699870112003149352380375124855230068487109373226251983");
var pb = new BigInt16("1814159566819970307982681716822107016038920170504391457462563485198126916735167260215619523429714031");
var pm = new BigInt16("5371393606024775251256550436773565977406724269152942136415762782810562554131599074907426010737503501");

console.log(p1.multiply(p2).toString());

console.log("" + _divAndMod(p1, p2));

//var p3 = new BigInt16(3);
//var p4 = new BigInt16(20);
//console.log("" + pb.aToBModC(p2, pm).aToBModC(p1, pm));
//console.log("" + pb.aToBModC(p1, pm).aToBModC(p2, pm));

var hex = "0x07588cdcc0fdecdf7a22208245b66352809e98c781868405b4333544ae499155391ce3baed6386a9005d";
var temp = new BigInt16(hex);
console.log(hex);
console.log(temp.toString());

//var a = new BigInt16(0x1);
//console.log("" + a.leftShiftAndSet(1));
//console.log("" + a.leftShiftAndSet(1));
//console.log("" + a.leftShiftAndSet(1));
//console.log("" + a.leftShiftAndSet(1));
//console.log("" + a.leftShiftAndSet(16));
//console.log("" + a.leftShiftAndSet(16));
//console.log("" + a.leftShiftAndSet(16));
//console.log("" + a.rightShiftAndSet(16));
//console.log("" + a.rightShiftAndSet(16));
//console.log("" + a.rightShiftAndSet(1));
//console.log("" + a.rightShiftAndSet(1));
//console.log("" + a.rightShiftAndSet(1));
//console.log("" + a.rightShiftAndSet(1));
//console.log("" + a.rightShiftAndSet(1));
//console.log("" + a.rightShiftAndSet(1));


////var p2 = new BigInt16(0x100000000);
//var p1 = new BigInt16(0x12341234);
//console.log("\n" + p2);
//console.log("" + p1);
//console.log("" + p2.divide(p1));
console.log("done");