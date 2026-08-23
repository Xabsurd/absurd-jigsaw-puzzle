import { Container, GraphicsPath, Rectangle, Texture } from 'pixi.js';
import PuzzleTile, { PathBounds, boundsFromPath } from './PuzzleTile';
import HitArea from './HitArea';
import type { DisplaySettings } from '../displaySettings';
import type { TileTool } from '../svgTools';

export type PuzzleCell = {
  column: number;
  row: number;
  pathBounds: PathBounds;
};

type GroupData = Container & { cells: PuzzleCell[] };

export function getGroupCells(group: Container): PuzzleCell[] {
  return (group as GroupData).cells ?? [];
}

export function setGroupCells(group: Container, cells: PuzzleCell[]) {
  (group as GroupData).cells = cells;
}

export function paintGroup(
  group: Container,
  cells: PuzzleCell[],
  texture: Texture,
  tileTool: TileTool,
  display: DisplaySettings
) {
  setGroupCells(group, cells);
  const loops = tileTool.getGroupLoops(cells.map((cell) => ({ x: cell.column, y: cell.row })));
  const regions = classifyLoops(loops);
  const path = regions.flatMap((region) => [region.outer, ...region.holes]).join(' ');
  for (const child of group.removeChildren()) {
    child.destroy({ children: true });
  }
  const tile = new PuzzleTile();
  tile.pathData = path;
  tile.pathBounds = boundsFromPath(path);
  tile.eventMode = 'none';
  tile.cullable = true;
  tile.interactiveChildren = false;
  for (const region of regions) {
    tile.beginPath();
    tile.path(new GraphicsPath(region.outer));
    tile.fill({
      texture,
      textureSpace: 'global'
    });
    if (!region.holes.length) continue;
    tile.beginPath();
    for (const hole of region.holes) {
      tile.path(new GraphicsPath(hole));
    }
    tile.cut();
  }
  void tile.bounds;
  tile.setStroke(display.showStroke, display.borderColor);
  group.addChild(tile);
  group.cullArea = new Rectangle(
    tile.pathBounds.x,
    tile.pathBounds.y,
    tile.pathBounds.width,
    tile.pathBounds.height
  );
  group.hitArea = new HitArea(group);
}

function loopPoints(path: string) {
  const points: { x: number; y: number }[] = [];
  const commands = path.match(/[MLC][^MLCZ]*/gi) || [];
  for (const command of commands) {
    const nums = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length < 2) continue;
    points.push({ x: nums[nums.length - 2], y: nums[nums.length - 1] });
  }
  return points;
}

function signedArea(points: { x: number; y: number }[]) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return area / 2;
}

function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const intersect = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function centroid(points: { x: number; y: number }[]) {
  const count = Math.max(1, points.length);
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / count,
    y: points.reduce((sum, p) => sum + p.y, 0) / count
  };
}

function reverseLoop(path: string) {
  const commands = path.match(/[MLC][^MLCZ]*/gi) || [];
  if (commands.length === 0) return path;
  const segs: { op: string; from: { x: number; y: number }; nums: number[]; to: { x: number; y: number } }[] = [];
  let x = 0;
  let y = 0;
  for (const command of commands) {
    const op = command[0].toUpperCase();
    const nums = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (nums.length < 2) continue;
    const from = { x, y };
    x = nums[nums.length - 2];
    y = nums[nums.length - 1];
    segs.push({ op, from, nums, to: { x, y } });
  }
  if (segs.length === 0) return path;
  const last = segs[segs.length - 1];
  let d = `M ${last.to.x} ${last.to.y}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const seg = segs[i];
    if (seg.op === 'C') {
      for (let k = seg.nums.length - 6; k >= 0; k -= 6) {
        const dest = k === 0 ? seg.from : { x: seg.nums[k - 2], y: seg.nums[k - 1] };
        d += ` C ${seg.nums[k + 2]} ${seg.nums[k + 3]} ${seg.nums[k]} ${seg.nums[k + 1]} ${dest.x} ${dest.y}`;
      }
    } else if (seg.op !== 'M' || i !== 0) {
      d += ` L ${seg.from.x} ${seg.from.y}`;
    }
  }
  return `${d} Z`;
}

function classifyLoops(loops: string[]) {
  const parsed = loops.map((path) => {
    const points = loopPoints(path);
    return { path, points, area: signedArea(points) };
  });
  parsed.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  const regions: { outer: string; holes: string[]; points: { x: number; y: number }[]; area: number }[] = [];
  for (const loop of parsed) {
    const center = centroid(loop.points);
    const parent = regions.find((region) => pointInPolygon(center, region.points));
    if (parent) {
      const hole = Math.sign(loop.area) === Math.sign(parent.area) ? reverseLoop(loop.path) : loop.path;
      parent.holes.push(hole);
    } else {
      regions.push({ outer: loop.path, holes: [], points: loop.points, area: loop.area });
    }
  }
  return regions;
}
