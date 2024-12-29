import * as THREE from 'three';
import { shuffle } from './utils';

var path_i = 0;

class Game {
	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		this.camera.position.z = 5;
		this.renderer = new THREE.WebGLRenderer();
		this.cubes = [];
		this.maze = [];
		this.path = [];
		this.path_cubes = [];

		this.renderer.setSize(512, 512);
		document.body.appendChild(this.renderer.domElement);

		this.setup_geometry();
		this.dest = [1, 1];
	}

	setup_geometry() {
		this.maze = [];
		this.dest = [0, 0];

		for (let i = 0; i < 50; i++) {
			this.maze.push([]);
			for (let j = 0; j < 50; j++) {
				this.maze.at(i).push(0);
			}
		}

		console.log(this.maze);
		this.build_maze(1, 1, 1, 1);

		for (let i = 0; i < 50; ++i) {
			for (let j = 0; j < 50; ++j) {
				if (this.maze[i][j])
					continue;

				const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
				const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);

				var cube = new THREE.Mesh(geometry, material);

				this.scene.add(cube);
				this.cubes.push(cube);

				cube.position.set((j / 4) - 6.25, (i / 4) - 6.25, -5);
			}
		}

		console.log(this.dest);
		this.solve_maze(1, 1);

		this.camera.position.z = 50 / 10;

		const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
		this.treat = new THREE.Mesh(geometry, material);
		this.scene.add(this.treat);
		this.treat.position.set((this.dest[1] / 4) - 6.25, (this.dest[0] / 4) - 6.25, -5);

		this.scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
		this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));
	}

	build_maze(x, y, prev_x, prev_y) {
		if (this.maze[x][y] == 1)
			return;
		if (this.maze[x][y] == 0 && (x - 1 < 0 || x + 1 == 50 || y - 1 < 0 || y + 1 == 50)) {
			return;
		}
		if (this.maze[x][y] == 0) {
			if (!(x + 1 == prev_x && y == prev_y) && this.maze[x + 1][y])
				return;
			if (!(x - 1 == prev_x && y == prev_y) && this.maze[x - 1][y])
				return;
			if (!(x == prev_x && y + 1 == prev_y) && this.maze[x][y + 1])
				return;
			if (!(x == prev_x && y - 1 == prev_y) && this.maze[x][y - 1])
				return;
		}

		this.maze[x][y] = 1;

		let dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
		shuffle(dirs);

		for (let i = 0; i < 4; ++i) {
			this.build_maze(x + Number(dirs[i][0]), y + Number(dirs[i][1]), x, y);
		}

		var px = (x - 1) * (x - 1);
		var py = (y - 1) * (y - 1);
		var dx = this.dest[0] * this.dest[0];
		var dy = this.dest[1] * this.dest[1];

		if (Math.sqrt(px + py) > Math.sqrt(dx + dy)) {
			this.dest[0] = x;
			this.dest[1] = y;
		}
	}

	solve_maze(x, y) {
		if (x < 0 || x == 50 || y < 0 || y == 50)
			return false;
		if (x == this.dest[0] && y == this.dest[1]) {
			console.log("Solved!");
			return true;
		}
		if (this.maze[x][y] == 0)
			return false;

		for (let i = this.path.length - 1; i > -1; --i) {
			let coord = this.path.at(i);
			if (coord[0] == x && coord[1] == y)
				return false;
		}

		this.path.push([x, y]);

		if (this.solve_maze(x + 1, y)) {
			return true;
		}
		if (this.solve_maze(x - 1, y)) {
			return true;
		}
		if (this.solve_maze(x, y + 1)) {
			return true;
		}
		if (this.solve_maze(x, y - 1)) {
			return true;
		}

		this.path.pop();

		return false;
	}

	set_renderer_callback(callback) {
		this.renderer.setAnimationLoop(callback);
	}

	reload() {
		this.scene = this.scene.clear();
		for (let i = 0; i < this.cubes.length; ++i) {
			let cube = this.cubes.at(i);
			cube.geometry.dispose();
			cube.material.dispose();
		}
		for (let i = 0; i < this.path_cubes.length; ++i) {
			let cube = this.path_cubes.at(i);
			cube.geometry.dispose();
			cube.material.dispose();
		}
		this.cubes = [];
		this.path = [];
		this.path_cubes = []
		this.setup_geometry();
		path_i = 0;
	}
}

let game = new Game();
var following = false;
var started = false;

function animate() {
	game.renderer.render(game.scene, game.camera);

	if (following) {
		if (game.path_cubes.length > 0)
			game.camera.lookAt(game.path_cubes.at(game.path_cubes.length - 1).position);
	} else {
		game.camera.lookAt(new THREE.Vector3(0, 0, -1));
	}

	if (game.path.length - 1 == path_i)
		return;

	if (!started)
		return;

	path_i++;
	const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
	const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);

	var cube = new THREE.Mesh(geometry, material);

	game.scene.add(cube);
	game.path_cubes.push(cube);

	cube.position.set((game.path[path_i][1] / 4) - 6.25, (game.path[path_i][0] / 4) - 6.25, -5);

	if (game.path.length - 1 == path_i)
		game.treat.material.color.setHex(0xffff00);
}

game.set_renderer_callback(animate);
document.getElementById("reload_button").onclick = function () { game.reload() };
document.getElementById("follow_button").onclick = function () { following = !following; };
let start_button = document.getElementById("start_button");
start_button.onclick = function () {
	started = !started;
	if (started)
		start_button.textContent = "Stop";
	else
		start_button.textContent = "Start";
};
