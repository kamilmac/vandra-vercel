/* eslint-disable */
import * as THREE from 'three';
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author rasmusgo / https://github.com/rasmusgo
 */

function clamp(num, min, max) {

	if (num <= min) return min;
	if (max <= num) return max;
	return num;

}

function signedRemainder(num, denom) {

	var remain = num % denom;
	if (remain > 0.5 * denom)
		return remain - denom;
	if (remain < -0.5 * denom)
		return remain + denom;
	return remain;

}

function easeInEaseOut(t) {
	return 3 * t * t - 2 * t * t * t;
}

// This set of controls performs orbiting, dollying (zooming).
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish

var VandraOrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI / 2.0; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE };

	// Animation speed restrictions
	this.animationRotationSpeed = 2.0; // Radians per second
	this.animationRadiusSpeed   = 2.0; // Meters per second
	this.animationTargetSpeed   = 2.0; // Meters per second
	this.animationZoomSpeed     = 2.0; // Zoom multiplier or divisor per second

	this.animate = false;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			if ( scope.animate && state === STATE.NONE ) {

				var t = clamp( (Date.now() - animationTime0) / animationTimeDelta, 0.0, 1.0);
				t = easeInEaseOut(t);

				spherical.phi = animationSpherical0.phi + animationSphericalDelta.phi * t;
				spherical.theta = animationSpherical0.theta + animationSphericalDelta.theta * t;
				spherical.radius = animationSpherical0.radius + animationSphericalDelta.radius * t;

				scope.target.copy(animationTarget0).addScaledVector(animationTargetDelta, t);

				scope.object.zoom = animationZoom0 * Math.pow(animationZoomFactor, t);
				zoomChanged = true;

				if ( t < 1.0 ) {
					requestAnimationFrame(update);
				} else {
					scope.animate = false;
				}

			} else {

				scope.animate = false;

				spherical.theta += sphericalDelta.theta;
				spherical.phi += sphericalDelta.phi;

			}

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			scope.object.position.copy( scope.positionFromSpherical(spherical) );

			scope.object.lookAt( new THREE.Vector3(0, 0, 0) );

			scope.object.position.add(scope.target);

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

			}

			scope.object.orthographicLerp = Math.pow(1 - Math.sin(spherical.phi), 2);
			scope.object.updateProjectionMatrix();

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.sphericalFromPosition = function(position) {
		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().invert();

		// rotate offset to "y-axis-is-up" space
		var offset = position.clone().applyQuaternion( quat );

		// angle from z-axis around y-axis
		var spherical = new THREE.Spherical();
		spherical.setFromVector3( offset )
		return spherical;
	}

	this.positionFromSpherical = function(spherical) {
		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().invert();
		var offset = new THREE.Vector3().setFromSpherical( spherical );

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion( quatInverse );
		return offset;
	}

	this.updateAnimationInternals = function(duration_factor) {
		animationTargetDelta.copy(animationTarget1).sub(animationTarget0);

		animationZoomFactor = animationZoom1 / animationZoom0;

		animationSphericalDelta.radius = animationSpherical1.radius - animationSpherical0.radius;
		animationSphericalDelta.phi   = signedRemainder(animationSpherical1.phi - animationSpherical0.phi, 2.0 * Math.PI);
		animationSphericalDelta.theta = signedRemainder(animationSpherical1.theta - animationSpherical0.theta, 2.0 * Math.PI);

		animationTime0 = Date.now();

		var rotationMagnitude = Math.sqrt(
			animationSphericalDelta.phi * animationSphericalDelta.phi +
			animationSphericalDelta.theta * animationSphericalDelta.theta);

		animationTimeDelta = 1000.0 * Math.max(
			rotationMagnitude                        / this.animationRotationSpeed,
			Math.abs(animationSphericalDelta.radius) / this.animationRadiusSpeed,
			animationTargetDelta.length()            / this.animationTargetSpeed,
			Math.abs(Math.log(animationZoomFactor) / Math.log(this.animationZoomSpeed)),
			0.001);

		if (duration_factor) {
			animationTimeDelta *= duration_factor;
		}
	}

	this.animateToPose = function(relative_position, target, zoom, duration_factor) {
		animationSpherical0.copy(spherical);
		animationSpherical1 = this.sphericalFromPosition(relative_position);

		animationTarget0.copy(this.target);
		animationTarget1.copy(target);

		animationZoom0 = this.object.zoom;
		animationZoom1 = zoom;

		this.animate = true;
		this.updateAnimationInternals(duration_factor);
		this.update();
	}

	this.jumpToPose = function(relative_position, target, zoom) {
		this.animate = false;
		this.object.position.copy(relative_position).add(target);
		this.target.copy(target);
		this.object.zoom = zoom;
		spherical.copy(this.sphericalFromPosition(relative_position));
		this.update();
	}

	this.updateTarget = function(target) {
		if (this.animate) {
			animationSpherical0.copy(spherical);
			animationTarget0.copy(this.target);
			animationTarget1.copy(target);
			animationZoom0 = this.object.zoom;
			this.updateAnimationInternals();
		} else {
			this.animateToPose(this.object.position.clone().sub(this.target), target, this.object.zoom);
		}
	}

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, TOUCH_ROTATE: 2, TOUCH_DOLLY: 3 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var animationSpherical0 = new THREE.Spherical();
	var animationSpherical1 = new THREE.Spherical();
	var animationSphericalDelta = new THREE.Spherical();

	var animationTarget0 = new THREE.Vector3();
	var animationTarget1 = new THREE.Vector3();
	var animationTargetDelta = new THREE.Vector3();

	var animationZoom0 = 1.0;
	var animationZoom1 = 1.0;
	var animationZoomFactor = 1.0;

	var animationTime0 = 0.0;
	var animationTimeDelta = 0.0;

	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	function dollyIn( dollyScale ) {

		scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
		scope.object.updateProjectionMatrix();
		zoomChanged = true;

	}

	function dollyOut( dollyScale ) {

		scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
		scope.object.updateProjectionMatrix();
		zoomChanged = true;

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		//console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		// console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		// console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleTouchStartRotate( event ) {

		//console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDolly( event ) {

		//console.log( 'handleTouchStartDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchMoveRotate( event ) {

		//console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		//console.log( 'handleTouchMoveDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {

		//console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( event.button === scope.mouseButtons.ORBIT ) {

			if ( scope.enableRotate === false ) return;

			handleMouseDownRotate( event );

			state = STATE.ROTATE;

		} else if ( event.button === scope.mouseButtons.ZOOM ) {

			if ( scope.enableZoom === false ) return;

			handleMouseDownDolly( event );

			state = STATE.DOLLY;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( state === STATE.ROTATE ) {

			if ( scope.enableRotate === false ) return;

			handleMouseMoveRotate( event );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.enableZoom === false ) return;

			handleMouseMoveDolly( event );

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		state = STATE.NONE;

		scope.dispatchEvent( endEvent );

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		handleMouseWheel( event );

		scope.dispatchEvent( startEvent ); // not sure why these are here...
		scope.dispatchEvent( endEvent );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // three-fingered touch: nothing

				return;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

				handleTouchMoveDolly( event );

				break;

			case 3: // three-fingered touch: nothing

				return;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		state = STATE.NONE;

		scope.dispatchEvent( endEvent );

	}

	function onContextMenu( event ) {

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	// force an update at start

	this.update();

};

VandraOrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
VandraOrbitControls.prototype.constructor = VandraOrbitControls;

export { VandraOrbitControls };
