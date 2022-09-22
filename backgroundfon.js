let w = c.width = window.innerWidth;
let h = c.height = window.innerHeight;
const ctx = c.getContext( '2d' );

const opts = {
    
    range: 180,
    baseConnections: 3,
    addedConnections: 5,
    baseSize: 5,
    minSize: 1,
    dataToConnectionSize: .4,
    sizeMultiplier: .7,
    allowedDist: 40,
    baseDist: 40,
    addedDist: 30,
    connectionAttempts: 100,
    
    dataToConnections: 1,
    baseSpeed: 0.01,
    addedSpeed: .05,
    baseGlowSpeed: .4,
    addedGlowSpeed: .4,
    
    rotVelX: .003,
    rotVelY: .002,
    
    repaintColor: '#212326',
    connectionColor: '#3E4247',
    rootColor: '#8CADA1',
    endColor: '#303338',
    dataColor: 'rgba(255,255,255,0.1)',
    
    wireframeWidth: .02,
    wireframeColor: '#212326',
    
    depth: 160,
    focalLength: 200,
    vanishPoint: {
        x: w / 2,
        y: h / 2
    }
};

const squareRange = opts.range * opts.range;
const squareAllowed = opts.allowedDist * opts.allowedDist;
const mostDistant = opts.depth + opts.range;
let sinX = sinY = 0;
let cosX = cosY = 0;
const connections = [];
const toDevelop = [];
const data = [];
const all = [];
let tick = 0;
const totalProb = 0;
let animating = false;
const Tau = Math.PI * 2;

ctx.fillStyle = '#222';
ctx.fillRect( 0, 0, w, h );
ctx.fillStyle = '#ccc';
ctx.font = '50px Verdana';
ctx.fillText( 'Calculating Nodes', w / 2 - ctx.measureText( 'Calculating Nodes' ).width / 2, h / 2 - 15 );

window.setTimeout( init, 4 ); // to render the loading screen

function init(){
	
	connections.length = 0;
	data.length = 0;
	all.length = 0;
	toDevelop.length = 0;
	
	const connection = new Connection( 0, 0, 0, opts.baseSize );
	connection.step = Connection.rootStep;
	connections.push( connection );
	all.push( connection );
	connection.link();
	
	while( toDevelop.length > 0 ){
	
		toDevelop[ 0 ].link();
		toDevelop.shift();
	}
	
	if( !animating ){
		animating = true;
		anim();
	}
}

class Connection {
    constructor(x, y, z, size) {
        
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        
        this.screen = {};
        
        this.links = [];
        this.probabilities = [];
        this.isEnd = false;
        
        this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
    }

    link() {
        if( this.size < opts.minSize )
            return this.isEnd = true;

        const links = [];
        const connectionsNum = opts.baseConnections + Math.random() * opts.addedConnections |0;
        let attempt = opts.connectionAttempts;
        let alpha;
        let beta;
        let len;
        let cosA;
        let sinA;
        let cosB;
        let sinB;
        var pos = {};
        let passedExisting;
        let passedBuffered;

        while( links.length < connectionsNum && --attempt > 0 ){
            
            alpha = Math.random() * Math.PI;
            beta = Math.random() * Tau;
            len = opts.baseDist + opts.addedDist * Math.random();
            
            cosA = Math.cos( alpha );
            sinA = Math.sin( alpha );
            cosB = Math.cos( beta );
            sinB = Math.sin( beta );
            
            pos.x = this.x + len * cosA * sinB;
            pos.y = this.y + len * sinA * sinB;
            pos.z = this.z + len *        cosB;
            
            if( pos.x*pos.x + pos.y*pos.y + pos.z*pos.z < squareRange ){
            
                passedExisting = true;
                passedBuffered = true;
                for( var i = 0; i < connections.length; ++i )
                    if( squareDist( pos, connections[ i ] ) < squareAllowed )
                        passedExisting = false;

                if( passedExisting )
                    for( var i = 0; i < links.length; ++i )
                        if( squareDist( pos, links[ i ] ) < squareAllowed )
                            passedBuffered = false;

                if( passedExisting && passedBuffered )
                    links.push( { x: pos.x, y: pos.y, z: pos.z } );
                
            }
            
        }

        if( links.length === 0 )
            this.isEnd = true;
        else {
            for( var i = 0; i < links.length; ++i ){
                const pos = links[ i ];
                const connection = new Connection( pos.x, pos.y, pos.z, this.size * opts.sizeMultiplier );

                this.links[ i ] = connection;
                all.push( connection );
                connections.push( connection );
            }
            for( var i = 0; i < this.links.length; ++i )
                toDevelop.push( this.links[ i ] );
        }
    }

    step() {
        
        this.setScreen();
        this.screen.color = ( this.isEnd ? opts.endColor : opts.connectionColor ).replace( 'light', 30 + ( ( tick * this.glowSpeed ) % 30 ) ).replace( 'alp', .2 + ( 1 - this.screen.z / mostDistant ) * .8 );
        
        for( let i = 0; i < this.links.length; ++i ){
            ctx.moveTo( this.screen.x, this.screen.y );
            ctx.lineTo( this.links[ i ].screen.x, this.links[ i ].screen.y );
        }
    }

    static rootStep() {
        this.setScreen();
        this.screen.color = opts.rootColor.replace( 'light', 30 + ( ( tick * this.glowSpeed ) % 30 ) ).replace( 'alp', ( 1 - this.screen.z / mostDistant ) * .8 );
        
        for( let i = 0; i < this.links.length; ++i ){
            ctx.moveTo( this.screen.x, this.screen.y );
            ctx.lineTo( this.links[ i ].screen.x, this.links[ i ].screen.y );
        }
    }

    draw() {
        ctx.fillStyle = this.screen.color;
        ctx.beginPath();
        ctx.arc( this.screen.x, this.screen.y, this.screen.scale * this.size, 0, Tau );
        ctx.fill();
    }
}

class Data {
    constructor(connection) {
        
        this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
        this.speed = opts.baseSpeed + opts.addedSpeed * Math.random();
        
        this.screen = {};
        
        this.setConnection( connection );
    }

    reset() {
        
        this.setConnection( connections[ 0 ] );
        this.ended = 2;
    }

    step() {
        
        this.proportion += this.speed;
        
        if( this.proportion < 1 ){
            this.x = this.ox + this.dx * this.proportion;
            this.y = this.oy + this.dy * this.proportion;
            this.z = this.oz + this.dz * this.proportion;
            this.size = ( this.os + this.ds * this.proportion ) * opts.dataToConnectionSize;
        } else 
            this.setConnection( this.nextConnection );
        
        this.screen.lastX = this.screen.x;
        this.screen.lastY = this.screen.y;
        this.setScreen();
        this.screen.color = opts.dataColor.replace( 'light', 40 + ( ( tick * this.glowSpeed ) % 50 ) ).replace( 'alp', .2 + ( 1 - this.screen.z / mostDistant ) * .6 );
        
    }

    draw() {
        
        if( this.ended )
            return --this.ended; // not sre why the thing lasts 2 frames, but it does
        
        ctx.beginPath();
        ctx.strokeStyle = this.screen.color;
        ctx.lineWidth = this.size * this.screen.scale;
        ctx.moveTo( this.screen.lastX, this.screen.lastY );
        ctx.lineTo( this.screen.x, this.screen.y );
        ctx.stroke();
    }

    setConnection(connection) {
        
        if( connection.isEnd )
            this.reset();
        
        else {
            
            this.connection = connection;
            this.nextConnection = connection.links[ connection.links.length * Math.random() |0 ];
            
            this.ox = connection.x; // original coordinates
            this.oy = connection.y;
            this.oz = connection.z;
            this.os = connection.size; // base size
            
            this.nx = this.nextConnection.x; // new
            this.ny = this.nextConnection.y;
            this.nz = this.nextConnection.z;
            this.ns = this.nextConnection.size;
            
            this.dx = this.nx - this.ox; // delta
            this.dy = this.ny - this.oy;
            this.dz = this.nz - this.oz;
            this.ds = this.ns - this.os;
            
            this.proportion = 0;
        }
    }
}

Connection.prototype.setScreen = Data.prototype.setScreen = function(){
    let x = this.x;
    let y = this.y;
    let z = this.z;

    // apply rotation on X axis
    const Y = y;
    y = y * cosX - z * sinX;
    z = z * cosX + Y * sinX;

    // rot on Y
    const Z = z;
    z = z * cosY - x * sinY;
    x = x * cosY + Z * sinY;

    this.screen.z = z;

    // translate on Z
    z += opts.depth;

    this.screen.scale = opts.focalLength / z;
    this.screen.x = opts.vanishPoint.x + x * this.screen.scale;
    this.screen.y = opts.vanishPoint.y + y * this.screen.scale;
}
function squareDist( a, b ){
    const x = b.x - a.x;
    const y = b.y - a.y;
    const z = b.z - a.z;

    return x*x + y*y + z*z;
}

function anim(){
    window.requestAnimationFrame( anim );

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = opts.repaintColor;
    ctx.fillRect( 0, 0, w, h );

    ++tick;

    const rotX = tick * opts.rotVelX;
    const rotY = tick * opts.rotVelY;

    cosX = Math.cos( rotX );
    sinX = Math.sin( rotX );
    cosY = Math.cos( rotY );
    sinY = Math.sin( rotY );

    if( data.length < connections.length * opts.dataToConnections ){
		const datum = new Data( connections[ 0 ] );
		data.push( datum );
		all.push( datum );
	}

    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.lineWidth = opts.wireframeWidth;
    ctx.strokeStyle = opts.wireframeColor;
    all.map( item => { item.step(); } );
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    all.sort( (a, b) => b.screen.z - a.screen.z );
    all.map( item => { item.draw(); } );

    /*ctx.beginPath();
	ctx.strokeStyle = 'red';
	ctx.arc( opts.vanishPoint.x, opts.vanishPoint.y, opts.range * opts.focalLength / opts.depth, 0, Tau );
	ctx.stroke();*/
}

window.addEventListener( 'resize', () => {
	
	opts.vanishPoint.x = ( w = c.width = window.innerWidth ) / 2;
	opts.vanishPoint.y = ( h = c.height = window.innerHeight ) / 2;
	ctx.fillRect( 0, 0, w, h );
});