var THREE = require('three');
var Detector = require('three/examples/js/Detector.js');
var GLTFLoader = require('three/examples/js/loaders/GLTFLoader.js');
var EXRLoader = require('three/examples/js/loaders/EXRLoader.js');
var EquirectangularToCubeGenerator = require('three/examples/js/loaders/EquirectangularToCubeGenerator.js');
var PMREMGenerator = require('three/examples/js/pmrem/PMREMGenerator.js');
var PMREMCubeUVPacker = require('three/examples/js/pmrem/PMREMCubeUVPacker.js');
const MayaControl = require('./MayaControl');

function onWindowResize(event){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}

let container, stats, controls;
let camera, scene, renderer;
let tanFOV, windowHeight;

let gltfLoader;
let exrLoader;

let mouse = new THREE.Vector2();
let model;

function init(){
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.up = new THREE.Vector3(0, 1, 0);
    camera.position.set(0.0, 1.0, 4.0);
    tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2) );
    windowHeight = window.innerHeight;
    window.addEventListener('resize', onWindowResize, false);


    scene = new THREE.Scene();
    scene.background = new THREE.Color('#242424');

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = false;
    renderer.gammaOutput = false;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    controls = new MayaControl.MayaControl.constructor(camera, renderer.domElement);

    exrLoader = new THREE.EXRLoader();
    gltfLoader = new THREE.GLTFLoader();
    gltfLoader.setCrossOrigin('');

    let gltfPath = './table.glb';
	loadEnvironment(exrLoader, './glazed_patio.exr').then(function (environment) {
		loadModel(gltfLoader, gltfPath).then(function (gltf) {
			model = gltf.scene;
			model.traverse(function (child) {
				if (child.isMesh) {
					child.material.envMap = environment.texture;
				}
			});
			model.position = new THREE.Vector3(0, 0, 0);
			scene.add(gltf.scene);

		}).catch(function (error) {
			updateMessage(`error when loading model '${error}'`);
			console.error(error);
		});
	});

    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function loadModel(loader, path){
    return new Promise((resolve, reject) => {
        updateMessage('loading model...');
        loader.load(path, function(gltf){
            updateMessage('');
            resolve(gltf);
        }, function(progress){
            let progressText = ((progress.loaded / progress.total) * 100).toFixed(0) + "%";
            updateMessage(progressText);
        }, function(error){
            updateMessage(`failed to retrieve model from '${path}'`);
            reject(error);
        });
    });
}

function loadEnvironment(loader, path){
    return new Promise((resolve, reject) => {
        loader.load(path, function(texture){
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.encoding = THREE.LinearEncoding;

            var cubemapGenerator = new THREE.EquirectangularToCubeGenerator(texture, 512);
            var cubeMapTexture = cubemapGenerator.update(renderer);

            var pmremGenerator = new THREE.PMREMGenerator(cubeMapTexture);
            pmremGenerator.update(renderer);

            var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
            pmremCubeUVPacker.update(renderer);

            let environment = pmremCubeUVPacker.CubeUVRenderTarget;


            texture.dispose();
            cubemapGenerator.dispose();
            pmremGenerator.dispose();
            pmremCubeUVPacker.dispose();

            resolve(environment);
        });
    });
}

function onDocumentMouseMove(event){
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

	renderer.render(scene, camera);
}

function updateMessage(message){
    document.getElementById("messages").innerText = message;
}

// ---------------------
// Run the app
// ---------------------
if (Detector.webgl) {
    init();
    animate();
} else {
    var warning = Detector.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}



