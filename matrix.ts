enum D_PORT{
    D1 = 0,
    D2 = 1
  }
enum M_PORT{
    M1 = 0,
    M2 = 2
}
enum RC_PORT{
    RC1 = 0,
    RC2 = 1
}
enum A_PORT{
    A1 = 0,
    A2 = 1
}
enum LED{
    RGB1 = 0,
    RGB2 = 1
}

//% weight=0 color=#0066CC icon="\uf2db" block="Matrix"
namespace Matrix{

    function Init():void{

        pins.setPull(DigitalPin.P5, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P11, PinPullMode.PullUp)

        pins.setPull(DigitalPin.P12, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P14, PinPullMode.PullUp)   

        pins.digitalWritePin(DigitalPin.P16, 0)
        pins.analogWritePin(AnalogPin.P0, 0)
        
        pins.digitalWritePin(DigitalPin.P16, 1)// pwm enable

        PCA9633.init()

        defl.setPixelColor(0, 0x000000)
        defl.setPixelColor(1, 0x000000)
        defl.show()
    }

    let defl = WS2812B.create(DigitalPin.P8, 2, RGB_MODE.RGB)
    Init()

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function on_data_received() {
        let buff = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        
        let getFlag = (buff.length == 7) ? true : false
        let setFlag = (buff.length == 9) ? true : false
        
        if((buff.indexOf('MICRO') == 0) && (getFlag || setFlag)){
            
            let func = Serial_IT.pInt(buff.replace('MICRO', ''))
            basic.showNumber(func)
            if(setFlag && func > 0){
                let para = Serial_IT.pInt(buff.replace('MICRO', ''))
                basic.showNumber(para)
                Serial_IT.setMicro(func, para-1)
            }
            else if(getFlag && func > 0){
                //serial.writeString(Serial_IT.getMicro(func-1))
            }
        }
    })

    /**
     *read data from D1 or D2
     *@param pin [0-1] choose D1 or D2; eg: 0, 1
    */
    //%block="read logic from |%pin|"
    //% weight=98 %blockID="Matrix_Dread"
    export function dread(pin: D_PORT): boolean{
        let Dpin = 0

        if (pin) {
            Dpin = pins.digitalReadPin(DigitalPin.P12)
        }
        else {
            Dpin = pins.digitalReadPin(DigitalPin.P14)
        }

        if (Dpin) {
            return false
        }
        else {
            return true
        }
    }

    /**
     *DC Motor
     *@param ch [0, 2] choose M1 or M2; eg: 0, 2
     *@param sp [-100-100] set motor speed; eg: 0, -90
    */
    //%block="DC motor |%ch| speed |%sp|"
    //%weight=93 %blockID="Maxrix_Motor"
    //% sp.min=-100 sp.max=100
    export function motor(ch: M_PORT, sp: number): void{
        
        let pwm = pins.map(Math.abs(sp), 0, 100, 0, 255)

        if (sp >= 0){    
            PCA9633.setPWM(ch, pwm)
            PCA9633.setPWM(ch+1, 0)
        }
        else{  
            PCA9633.setPWM(ch+1, pwm)
            PCA9633.setPWM(ch, 0)
        }

    }


    /**
     *set RC servo angle
     *@param port [0-1] choose RC1 or RC2; eg: 0, 1
    */
    //%block="RC servo |%port| angle |%angle|"
    //%weight=95 %blockID="Matrix_Servo"
    //% angle.min=0 angle.max=180
    export function servo(port: RC_PORT, angle: number): void{

        if (port) {
            pins.servoWritePin(AnalogPin.P2, angle)
        }
        else {
            pins.servoWritePin(AnalogPin.P13, angle)
        }

    }

    /**
     *release all servo motor
    */
    //%block="RC servo release"
    //%weight=94 %blockID="Matrix Servo Release"
    export function servoRelease(): void{

        control.waitMicros(150000)

        pins.digitalWritePin(DigitalPin.P2, 0)
        pins.digitalWritePin(DigitalPin.P13, 0)

        control.waitMicros(500000)

    }

    /**
     *read distance from ultrasonic sensor
     *@param port [0-1] choose D1 or D2; eg: 0, 1
    */
    //%block="ultrasonic sensor |%port|"
    //%weight=97 %blockID="Matrix_Ultrasonic"
    export function ultrasonic(port: D_PORT): number{

        if (port) {
            return (SR04.distance(DigitalPin.P12, DigitalPin.P15))
        }
        else {
            return (SR04.distance(DigitalPin.P14, DigitalPin.P1))
        }

    }

    /**
     *read analog port
     *@param ch [0-1] choose A1 or A2; eg: 0, 1
    */
    //%block="read data from |%ch|"
    //%weight=96 %blockID="Matrix_ADC"
    export function readADC(ch: A_PORT): number{

        let data = 0

        if (ch) {
            data = ADS1015.readPin(3)
        }
        else {
            data = ADS1015.readPin(1)
        }
        
        return (Math.round(pins.map(data, -1667, 1667, -1023, 1023)))

    }

    /**
     *set LED RGB
     *@param led [0-1] set the displayed LED; eg: 0,1
     *@param r [0-255] set LED Red brightness; eg: 0,225
     *@param g [0-255] set LED Green brightness; eg: 0,225
     *@param b [0-255] set LED Blue brightness; eg: 0,225
    */
    //%block="LED%led R%r G%g B%b"
    //%weight=99 %blockID="Matrix_LED"
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    export function showLED(led: LED, r: number, g: number, b: number): void{
        
        let rgb = r * 256 * 256 + g * 256 + b
        
        defl.setPixelColor(led, rgb)
        defl.show()

        control.waitMicros(500)
    }
}
