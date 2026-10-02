import { mount } from './mount';

// The isolated world persists between injections, so a second injection finds the first one and closes it.
const w = window as Window & { __lidar?: { close(): void } };
if (w.__lidar) w.__lidar.close();
else w.__lidar = mount(() => delete w.__lidar);
