import { useState, useCallback, useRef, useEffect } from "react";
import CampusMap from "../components/CampusMap";
import {
  X,
  MapPin,
  Save,
  RotateCw,
  Maximize2,
  Move,
  Trash2,
  Plus,
  Undo,
  Redo,
  Grid3X3,
  Eye,
  EyeOff,
  Layers,
  Link,
  Settings,
  Info,
  Check,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Train,
  Download,
  Upload,
  RotateCcw,
  Pencil,
  Circle,
  Square,
  Hexagon,
  Box,
  MousePointer,
  Ruler,
} from "lucide-react";
import { useStore } from "../store/useStore";

export default function MapBuilderPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(1);
  const [creativeMode, setCreativeMode] = useState(true);
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerPoints, setRulerPoints] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [mapName, setMapName] = useState("");
  const [notification, setNotification] = useState(null);
  const [draggedResource, setDraggedResource] = useState(null);

  const markers = useStore((state) => state.markers);
  const paths = useStore((state) => state.paths);
  const savedMaps = useStore((state) => state.savedMaps);
  const currentMapName = useStore((state) => state.currentMapName);
  const setShowDecorations = useStore((state) => state.setShowDecorations);
  const updateBuildingPosition = useStore(
    (state) => state.updateBuildingPosition,
  );
  const updateBuildingRotation = useStore(
    (state) => state.updateBuildingRotation,
  );
  const updateBuildingScale = useStore((state) => state.updateBuildingScale);
  const toggleBuildingLock = useStore((state) => state.toggleBuildingLock);
  const addBuilding = useStore((state) => state.addBuilding);
  const deleteBuilding = useStore((state) => state.deleteBuilding);
  const addPath = useStore((state) => state.addPath);
  const updatePath = useStore((state) => state.updatePath);
  const deletePath = useStore((state) => state.deletePath);
  const updatePathPoint = useStore((state) => state.updatePathPoint);
  const addPathPoint = useStore((state) => state.addPathPoint);
  const removePathPoint = useStore((state) => state.removePathPoint);
  const saveMap = useStore((state) => state.saveMap);
  const loadMap = useStore((state) => state.loadMap);
  const deleteSavedMap = useStore((state) => state.deleteSavedMap);
  const resetToDefault = useStore((state) => state.resetToDefault);
  const clearMap = useStore((state) => state.clearMap);
  const loadFromLocalStorage = useStore((state) => state.loadFromLocalStorage);

  useEffect(() => {
    setShowDecorations(false);
    const saved = localStorage.getItem("navly_markers");
    if (saved) {
      try {
        const markers = JSON.parse(saved);
        if (markers && markers.length > 0) {
          useStore.getState().loadFromLocalStorage();
        }
      } catch (e) {}
    }
  }, []);

  const [buildingForm, setBuildingForm] = useState({
    name: "New Building",
    type: "academic",
    description: "New Building",
    position: [0, 0, 0],
    rotation: 0,
    rotationX: 0,
    rotationZ: 0,
    scale: [1, 1, 1],
    roomCount: 6,
    roomsPerSide: 3,
    corridorWidth: 3,
    locked: false,
  });

  const calculateRulerDistance = (points) => {
    if (!points || points.length < 2) return 0;
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dz = points[i + 1].z - points[i].z;
      distance += Math.sqrt(dx * dx + dz * dz);
    }
    return distance.toFixed(2);
  };

  const handleRulerPointClick = (position) => {
    if (!rulerMode) return;
    const newPoints = [...rulerPoints, { x: position[0], z: position[2] }];
    setRulerPoints(newPoints);
  };

  const handleClearRuler = () => {
    setRulerPoints([]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedBuilding) handleDeleteBuilding();
        if (selectedPath) handleDeletePath();
      }

      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        if (selectedBuilding) handleDuplicateBuilding();
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        useStore.getState().redo();
      } else if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        useStore.getState().undo();
      } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useStore.getState().redo();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMove(0, -1);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMove(0, 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMove(-1, 0);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMove(1, 0);
      }

      if (e.key === "r" || e.key === "R") {
        if (selectedBuilding && !selectedBuilding.locked) handleRotateRight();
      }

      if (e.key === "t" || e.key === "T") {
        if (selectedBuilding && !selectedBuilding.locked) handleRotateLeft();
      }

      if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleRotateLeft();
      }
      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleRotateRight();
      }

      if (e.key === "x" || e.key === "X") {
        if (selectedBuilding && !selectedBuilding.locked)
          handleRotateVertical(15);
      }
      if (e.key === "c" || e.key === "C") {
        if (selectedBuilding && !selectedBuilding.locked)
          handleRotateVertical(-15);
      }

      if (e.key === "z" || e.key === "Z") {
        if (selectedBuilding && !selectedBuilding.locked) handleRotateTilt(15);
      }
      if (e.key === "v" || e.key === "V") {
        if (selectedBuilding && !selectedBuilding.locked) handleRotateTilt(-15);
      }

      if (
        (e.key === "e" || e.key === "E") &&
        (selectedBuilding?.type === "wall" ||
          selectedBuilding?.type === "gate" ||
          selectedBuilding?.modelType?.includes("Gate"))
      ) {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMoveUp();
      }
      if (
        (e.key === "q" || e.key === "Q") &&
        (selectedBuilding?.type === "wall" ||
          selectedBuilding?.type === "gate" ||
          selectedBuilding?.modelType?.includes("Gate"))
      ) {
        e.preventDefault();
        if (selectedBuilding && !selectedBuilding.locked) handleMoveDown();
      }

      if (e.key === "l" || e.key === "L") {
        if (selectedBuilding) handleToggleLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBuilding, selectedPath]);

  const [pathForm, setPathForm] = useState({
    name: "New Path",
    type: "path",
    points: [
      [0, 0, 0],
      [20, 0, 0],
    ],
    width: 4,
  });

  const handleDragEnd = (id, newPosition) => {
    const building = markers.find((b) => b.id === id);
    if (building?.locked) return;

    let finalPosition = newPosition;
    if (!creativeMode && snapToGrid) {
      const snapValue = gridSize;
      finalPosition = [
        Math.round(newPosition[0] / snapValue) * snapValue,
        0,
        Math.round(newPosition[2] / snapValue) * snapValue,
      ];
    }
    if (creativeMode) {
      finalPosition = [newPosition[0], 0, newPosition[2]];
    }
    updateBuildingPosition(id, finalPosition);
  };

  const handlePathPointDrag = (pathId, pointIndex, newPosition) => {
    let finalPosition = newPosition;
    if (!creativeMode && snapToGrid) {
      const snapValue = gridSize;
      finalPosition = [
        Math.round(newPosition[0] / snapValue) * snapValue,
        0,
        Math.round(newPosition[2] / snapValue) * snapValue,
      ];
    }
    if (creativeMode) {
      finalPosition = [newPosition[0], 0, newPosition[2]];
    }
    updatePathPoint(pathId, pointIndex, finalPosition);
  };

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building);
    setSelectedPath(null);
    setSelectedPointIndex(null);
    if (building) {
      setBuildingForm({
        name: building.name,
        type: building.type,
        description: building.description || "",
        position: building.position,
        rotation: building.rotation || 0,
        rotationX: building.rotationX || 0,
        rotationZ: building.rotationZ || 0,
        scale: building.scale || [1, 1, 1],
        roomCount: building.roomCount || 6,
        roomsPerSide: building.roomsPerSide || 3,
        corridorWidth: building.corridorWidth || 3,
        locked: building.locked || false,
      });
    }
  };

  const handlePathSelect = (path, pointIndex = null) => {
    setSelectedPath(path);
    setSelectedPointIndex(pointIndex);
    setSelectedBuilding(null);
    setPathForm({
      name: path.name,
      type: path.type,
      points: path.points,
      width: path.width,
    });
  };

  const handlePointSelect = (index) => {
    setSelectedPointIndex(index);
  };

  const handleUpdateBuilding = () => {
    if (selectedBuilding) {
      const updates = {
        name: buildingForm.name,
        type: buildingForm.type,
        description: buildingForm.description,
        rotation: buildingForm.rotation,
        scale: buildingForm.scale,
        position: buildingForm.position,
      };

      if (selectedBuilding.type === "long_building") {
        updates.roomCount = buildingForm.roomCount;
        updates.roomsPerSide = buildingForm.roomsPerSide;
        updates.corridorWidth = buildingForm.corridorWidth;
      }

      useStore.getState().updateBuilding(selectedBuilding.id, updates);
      setSelectedBuilding({ ...selectedBuilding, ...buildingForm });
    }
  };

  const handleUpdatePath = () => {
    if (selectedPath) {
      updatePath(selectedPath.id, {
        name: pathForm.name,
        type: pathForm.type,
        width: pathForm.width,
        points: pathForm.points,
      });
      setSelectedPath({ ...selectedPath, ...pathForm });
    }
  };

  const calculatePathDistance = (points) => {
    if (!points || points.length < 2) return 0;
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0];
      const dz = points[i + 1][2] - points[i][2];
      distance += Math.sqrt(dx * dx + dz * dz);
    }
    return distance.toFixed(1);
  };

  const handleDeleteBuilding = async () => {
    if (!selectedBuilding) return;
    if (selectedBuilding.locked) {
      setNotification({
        type: "info",
        message: "Unlock building first before deleting!",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const confirmed = window.confirm(`Delete "${selectedBuilding.name}"?`);
    if (confirmed) {
      deleteBuilding(selectedBuilding.id);
      setSelectedBuilding(null);
      setNotification({ type: "success", message: "Building deleted!" });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleDuplicateBuilding = () => {
    if (selectedBuilding) {
      const snapValue = snapToGrid ? gridSize : 1;
      const newPosition = [
        Math.round((selectedBuilding.position[0] + snapValue) / snapValue) *
          snapValue,
        selectedBuilding.position[1] || 0,
        Math.round((selectedBuilding.position[2] + snapValue) / snapValue) *
          snapValue,
      ];
      const newBuilding = {
        ...selectedBuilding,
        id: Date.now(),
        name: selectedBuilding.name + " (Copy)",
        position: newPosition,
        rotation: selectedBuilding.rotation || 0,
        rotationX: selectedBuilding.rotationX || 0,
        rotationZ: selectedBuilding.rotationZ || 0,
        locked: false,
      };
      addBuilding(newBuilding);
    }
  };

  const handleDeletePath = () => {
    if (selectedPath && window.confirm(`Delete ${selectedPath.name}?`)) {
      deletePath(selectedPath.id);
      setSelectedPath(null);
      setSelectedPointIndex(null);
    }
  };

  const handleAddPathPoint = () => {
    if (selectedPath) {
      const lastPoint = selectedPath.points[selectedPath.points.length - 1];
      addPathPoint(selectedPath.id, [lastPoint[0] + 10, 0, lastPoint[2] + 10]);
      setSelectedPath({
        ...selectedPath,
        points: [
          ...selectedPath.points,
          [lastPoint[0] + 10, 0, lastPoint[2] + 10],
        ],
      });
    }
  };

  const handleRemovePathPoint = () => {
    if (
      selectedPath &&
      selectedPointIndex !== null &&
      selectedPath.points.length > 2
    ) {
      removePathPoint(selectedPath.id, selectedPointIndex);
      setSelectedPointIndex(null);
    }
  };

  const handleRotateLeft = () => {
    if (selectedBuilding && !selectedBuilding.locked) {
      const newRotation = (selectedBuilding.rotation || 0) - 15;
      updateBuildingRotation(selectedBuilding.id, newRotation);
      setSelectedBuilding({ ...selectedBuilding, rotation: newRotation });
      setBuildingForm({ ...buildingForm, rotation: newRotation });
    }
  };

  const handleRotateRight = () => {
    if (selectedBuilding && !selectedBuilding.locked) {
      const newRotation = (selectedBuilding.rotation || 0) + 15;
      updateBuildingRotation(selectedBuilding.id, newRotation);
      setSelectedBuilding({ ...selectedBuilding, rotation: newRotation });
      setBuildingForm({ ...buildingForm, rotation: newRotation });
    }
  };

  const handleRotateVertical = (delta) => {
    if (selectedBuilding && !selectedBuilding.locked) {
      const newRotationX = (selectedBuilding.rotationX || 0) + delta;
      const updates = { rotationX: newRotationX };
      useStore.getState().updateBuilding(selectedBuilding.id, updates);
      setSelectedBuilding({ ...selectedBuilding, ...updates });
      setBuildingForm({ ...buildingForm, ...updates });
    }
  };

  const handleRotateTilt = (delta) => {
    if (selectedBuilding && !selectedBuilding.locked) {
      const newRotationZ = (selectedBuilding.rotationZ || 0) + delta;
      const updates = { rotationZ: newRotationZ };
      useStore.getState().updateBuilding(selectedBuilding.id, updates);
      setSelectedBuilding({ ...selectedBuilding, ...updates });
      setBuildingForm({ ...buildingForm, ...updates });
    }
  };

  const handleToggleLock = () => {
    if (selectedBuilding) {
      toggleBuildingLock(selectedBuilding.id);
      const newLocked = !selectedBuilding.locked;
      setSelectedBuilding({ ...selectedBuilding, locked: newLocked });
      setBuildingForm({ ...buildingForm, locked: newLocked });
    }
  };

  const handleScaleUp = () => {
    if (selectedBuilding) {
      const newScale = [
        Math.min((selectedBuilding.scale?.[0] || 1) + 0.1, 2),
        Math.min((selectedBuilding.scale?.[1] || 1) + 0.1, 2),
        Math.min((selectedBuilding.scale?.[2] || 1) + 0.1, 2),
      ];
      updateBuildingScale(selectedBuilding.id, newScale);
      setSelectedBuilding({ ...selectedBuilding, scale: newScale });
      setBuildingForm({ ...buildingForm, scale: newScale });
    }
  };

  const handleMoveUp = () => {
    if (selectedBuilding) {
      const currentY = selectedBuilding.position?.[1] || 0;
      const newY = creativeMode ? currentY + 1 : currentY + gridSize * 0.5;
      const newPos = [
        selectedBuilding.position[0],
        newY,
        selectedBuilding.position[2],
      ];
      updateBuildingPosition(selectedBuilding.id, newPos);
      setSelectedBuilding({ ...selectedBuilding, position: newPos });
      setBuildingForm({ ...buildingForm, position: newPos });
    }
  };

  const handleMoveDown = () => {
    if (selectedBuilding) {
      const currentY = selectedBuilding.position?.[1] || 0;
      const newY = Math.max(
        0,
        creativeMode ? currentY - 1 : currentY - gridSize * 0.5,
      );
      const newPos = [
        selectedBuilding.position[0],
        newY,
        selectedBuilding.position[2],
      ];
      updateBuildingPosition(selectedBuilding.id, newPos);
      setSelectedBuilding({ ...selectedBuilding, position: newPos });
      setBuildingForm({ ...buildingForm, position: newPos });
    }
  };

  const handleScaleDown = () => {
    if (selectedBuilding) {
      const newScale = [
        Math.max((selectedBuilding.scale?.[0] || 1) - 0.1, 0.5),
        Math.max((selectedBuilding.scale?.[1] || 1) - 0.1, 0.5),
        Math.max((selectedBuilding.scale?.[2] || 1) - 0.1, 0.5),
      ];
      updateBuildingScale(selectedBuilding.id, newScale);
      setSelectedBuilding({ ...selectedBuilding, scale: newScale });
      setBuildingForm({ ...buildingForm, scale: newScale });
    }
  };

  const handleMove = (dx, dz) => {
    if (selectedBuilding && !selectedBuilding.locked) {
      let moveX = dx;
      let moveZ = dz;
      if (creativeMode) {
        moveX = dx * gridSize;
        moveZ = dz * gridSize;
      } else if (snapToGrid) {
        moveX = dx * gridSize;
        moveZ = dz * gridSize;
      }
      const newPos = [
        selectedBuilding.position[0] + moveX,
        selectedBuilding.position[1] || 0,
        selectedBuilding.position[2] + moveZ,
      ];
      updateBuildingPosition(selectedBuilding.id, newPos);
      setSelectedBuilding({ ...selectedBuilding, position: newPos });
      setBuildingForm({ ...buildingForm, position: newPos });
    }
  };

  const handleAddPath = (type = "path", color = null, width = null) => {
    const newPath = {
      name:
        type === "railway"
          ? "New Railway"
          : type === "road" || type === "highway"
            ? "New Road"
            : "New Path",
      type: type,
      points:
        type === "railway"
          ? [
              [-30, 0, 0],
              [30, 0, 0],
            ]
          : [
              [0, 0, 0],
              [20, 0, 0],
              [40, 0, 20],
            ],
      width:
        width ||
        (type === "highway"
          ? 12
          : type === "railway"
            ? 4
            : type === "road"
              ? 8
              : 3),
      color:
        color ||
        (type === "railway"
          ? "#1f2937"
          : type === "highway"
            ? "#1F2937"
            : type === "road"
              ? "#374151"
              : "#64748b"),
    };
    addPath(newPath);
  };

  const handleAddElement = (element) => {
    if (
      element.type === "path" ||
      element.type === "road" ||
      element.type === "railway" ||
      element.type === "highway"
    ) {
      handleAddPath(element.type, element.color, element.width);
      return;
    }
    let position = element.position || [0, 0, 0];
    if (!element.position) {
      if (creativeMode || snapToGrid) {
        position = [
          Math.round((Math.random() * 20 - 10) / gridSize) * gridSize,
          0,
          Math.round((Math.random() * 20 - 10) / gridSize) * gridSize,
        ];
      } else {
        position = [Math.random() * 20 - 10, 0, Math.random() * 20 - 10];
      }
    }
    const newBuilding = {
      name: element.name,
      type: element.type,
      description: element.description,
      position: position,
      rotation: 0,
      rotationX: 0,
      rotationZ: 0,
      scale: element.scale || [1, 1, 1],
      floors: element.floors || [
        {
          name: "Ground Floor",
          rooms: [
            { id: "f1", name: "Main Area", type: "feature", capacity: 0 },
          ],
        },
      ],
      color: element.color,
      blockType: element.blockType || null,
      modelType: element.modelType || null,
      transparent: element.transparent || false,
      emissive: element.emissive || false,
      locked: false,
      ...(element.type === "long_building"
        ? {
            roomCount: element.roomCount || 6,
            roomsPerSide: element.roomsPerSide || 3,
            corridorWidth: element.corridorWidth || 3,
          }
        : {}),
    };
    addBuilding(newBuilding);
  };

  const autoConnectBuildings = () => {
    const currentMarkers = useStore.getState().markers;
    const currentPaths = useStore.getState().paths;

    const getDistance = (p1, p2) =>
      Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2);

    const findNearestPath = (buildingPos) => {
      let nearestPoint = null;
      let minDist = Infinity;
      let nearestPath = null;

      for (const path of currentPaths) {
        if (!path.points || path.points.length < 2) continue;
        for (let i = 0; i < path.points.length - 1; i++) {
          const p1 = path.points[i];
          const p2 = path.points[i + 1];
          const midX = (p1[0] + p2[0]) / 2;
          const midZ = (p1[2] + p2[2]) / 2;
          const dist = getDistance(buildingPos, [midX, 0, midZ]);
          if (dist < minDist) {
            minDist = dist;
            nearestPoint = [midX, 0, midZ];
            nearestPath = path;
          }
        }
      }
      return { point: nearestPoint, path: nearestPath, distance: minDist };
    };

    const newNavPoints = [];
    const existingNavPoints = currentMarkers.filter(
      (m) => m.type === "navPoint",
    );

    for (const building of currentMarkers) {
      if (
        building.type === "navPoint" ||
        building.type === "wall" ||
        building.type === "gate"
      )
        continue;
      if (!building.position) continue;

      const buildingPos = building.position;
      const {
        point: nearestPathPoint,
        path: connectedPath,
        distance,
      } = findNearestPath(buildingPos);

      if (nearestPathPoint && distance > 8) {
        const midX = (buildingPos[0] + nearestPathPoint[0]) / 2;
        const midZ = (buildingPos[2] + nearestPathPoint[2]) / 2;
        newNavPoints.push({
          name: `${building.name} Entrance`,
          type: "navPoint",
          description: `Entrance waypoint for ${building.name}`,
          position: [midX, 0, midZ],
          color: building.color || "#10B981",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "ent1",
                  name: `${building.name} Entrance`,
                  type: "entrance",
                  capacity: 0,
                },
              ],
            },
          ],
        });
      }
    }

    for (const np of newNavPoints) {
      if (!existingNavPoints.find((ep) => ep.name === np.name)) {
        addBuilding(np);
      }
    }

    if (newNavPoints.length > 0) {
      setNotification({
        type: "success",
        message: `Added ${newNavPoints.length} entrance waypoints!`,
      });
    } else {
      setNotification({
        type: "info",
        message: "Buildings already connected to paths!",
      });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAutoConnectPaths = () => {
    const currentPaths = useStore.getState().paths;
    const allBuildings = useStore.getState().markers;

    const getDistance = (p1, p2) =>
      Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2);

    const getBuildingEdgePoints = (building) => {
      if (!building.position) return [];
      const pos = building.position;
      const scale = building.scale || [1, 1, 1];
      const w = ((scale[0] || 1) * 10) / 2 + 3;
      const d = ((scale[2] || 1) * 10) / 2 + 3;
      return [
        [pos[0] - w, 0, pos[2] - d],
        [pos[0] + w, 0, pos[2] - d],
        [pos[0] + w, 0, pos[2] + d],
        [pos[0] - w, 0, pos[2] + d],
      ];
    };

    const isNearExistingPath = (point) => {
      for (const path of currentPaths) {
        if (!path.points || path.points.length < 2) continue;
        const width = path.width || 4;
        for (let i = 0; i < path.points.length - 1; i++) {
          const p1 = path.points[i];
          const p2 = path.points[i + 1];
          const dx = p2[0] - p1[0];
          const dz = p2[2] - p1[2];
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len < 0.1) continue;
          const t = Math.max(
            0,
            Math.min(
              1,
              ((point[0] - p1[0]) * dx + (point[2] - p1[2]) * dz) / (len * len),
            ),
          );
          const nearX = p1[0] + t * dx;
          const nearZ = p1[2] + t * dz;
          if (
            Math.sqrt((point[0] - nearX) ** 2 + (point[2] - nearZ) ** 2) <
            width / 2 + 5
          ) {
            return true;
          }
        }
      }
      return false;
    };

    let pathChanges = 0;

    for (const building of allBuildings) {
      if (
        building.type === "navPoint" ||
        building.type === "wall" ||
        building.type === "gate"
      )
        continue;
      if (!building.position) continue;

      const edgePoints = getBuildingEdgePoints(building);
      const doorPoints = edgePoints.filter((ep) => !isNearExistingPath(ep));

      for (const doorPoint of doorPoints) {
        const nearestPathInfo = { path: null, point: null, distance: Infinity };

        for (const path of currentPaths) {
          if (!path.points || path.points.length < 2) continue;
          for (let i = 0; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i + 1];
            const dist1 = getDistance(doorPoint, [p1[0], 0, p1[2]]);
            const dist2 = getDistance(doorPoint, [p2[0], 0, p2[2]]);
            if (dist1 < nearestPathInfo.distance) {
              nearestPathInfo.distance = dist1;
              nearestPathInfo.path = path;
              nearestPathInfo.point = [...p1];
            }
            if (dist2 < nearestPathInfo.distance) {
              nearestPathInfo.distance = dist2;
              nearestPathInfo.path = path;
              nearestPathInfo.point = [...p2];
            }
          }
        }

        if (
          nearestPathInfo.path &&
          nearestPathInfo.distance > 5 &&
          nearestPathInfo.distance < 30
        ) {
          const newPath = {
            name: `${building.name} Path`,
            type: "path",
            points: [doorPoint, nearestPathInfo.point],
            width: 4,
            color: "#9CA3AF",
          };
          addPath(newPath);
          pathChanges++;
        }
      }
    }

    if (pathChanges > 0) {
      setNotification({
        type: "success",
        message: `Connected ${pathChanges} buildings to path network!`,
      });
    } else {
      setNotification({
        type: "info",
        message: "All buildings already connected!",
      });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (mapName.trim()) {
      saveMap(mapName.trim());
      setShowSaveModal(false);
      setMapName("");
      setNotification({
        type: "success",
        message: `Map "${mapName.trim()}" saved successfully!`,
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLoad = (mapData) => {
    setShowDecorations(false);
    loadMap(mapData);
    setShowLoadModal(false);
    setSelectedBuilding(null);
    setSelectedPath(null);
    setNotification({
      type: "info",
      message: `Map "${mapData.name}" loaded! ${mapData.buildings?.length || 0} buildings, ${mapData.paths?.length || 0} paths`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Reset to default campus? This will clear all unsaved changes.",
      )
    ) {
      resetToDefault();
      setSelectedBuilding(null);
      setSelectedPath(null);
      setNotification({
        type: "info",
        message: "Map cleared! Starting fresh.",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleClear = () => {
    if (
      window.confirm(
        "Clear all buildings and paths? This will create a blank map from scratch.",
      )
    ) {
      clearMap();
      setSelectedBuilding(null);
      setSelectedPath(null);
      setNotification({
        type: "info",
        message: "Map cleared! Starting fresh.",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const resources = [
    {
      category: "Academic Buildings",
      items: [
        {
          name: "College of Education",
          type: "academic",
          description:
            "Teacher Education Building - BEEd, BSEd, BPE, BTVTEd programs",
          color: "#8B4513",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "ce1",
                  name: "Registration Office",
                  type: "office",
                  capacity: 5,
                },
                {
                  id: "ce2",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 8,
                },
                {
                  id: "ce3",
                  name: "Lecture Room 101",
                  type: "classroom",
                  capacity: 45,
                },
                {
                  id: "ce4",
                  name: "Lecture Room 102",
                  type: "classroom",
                  capacity: 45,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "ce5",
                  name: "Lecture Room 201",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "ce6",
                  name: "Lecture Room 202",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "ce7",
                  name: "Practice Teaching Room",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "ce8",
                  name: "Faculty Room",
                  type: "office",
                  capacity: 15,
                },
              ],
            },
          ],
        },
        {
          name: "College of Business",
          type: "academic",
          description: "Business Administration - BSA, BSMA, BSBA programs",
          color: "#1E3A5F",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "cb1",
                  name: "Business Center",
                  type: "office",
                  capacity: 10,
                },
                {
                  id: "cb2",
                  name: "Accounting Lab",
                  type: "laboratory",
                  capacity: 35,
                },
                {
                  id: "cb3",
                  name: "Lecture Hall A",
                  type: "lecture",
                  capacity: 80,
                },
                {
                  id: "cb4",
                  name: "Lecture Hall B",
                  type: "lecture",
                  capacity: 60,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "cb5",
                  name: "Management Lab",
                  type: "computer",
                  capacity: 40,
                },
                {
                  id: "cb6",
                  name: "Marketing Room",
                  type: "classroom",
                  capacity: 45,
                },
                {
                  id: "cb7",
                  name: "Finance Room",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "cb8",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 6,
                },
              ],
            },
          ],
        },
        {
          name: "College of Computer Studies",
          type: "academic",
          description: "IT & Engineering - BSIT, BSCpE programs",
          color: "#2563EB",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "ccs1", name: "IT Office", type: "office", capacity: 8 },
                {
                  id: "ccs2",
                  name: "Programming Lab 1",
                  type: "computer",
                  capacity: 35,
                },
                {
                  id: "ccs3",
                  name: "Programming Lab 2",
                  type: "computer",
                  capacity: 35,
                },
                {
                  id: "ccs4",
                  name: "Server Room",
                  type: "server",
                  capacity: 5,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "ccs5",
                  name: "Engineering Lab",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "ccs6",
                  name: "Multimedia Lab",
                  type: "computer",
                  capacity: 30,
                },
                {
                  id: "ccs7",
                  name: "Lecture Room",
                  type: "classroom",
                  capacity: 50,
                },
                {
                  id: "ccs8",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 6,
                },
              ],
            },
          ],
        },
        {
          name: "College of Science",
          type: "academic",
          description: "Natural Sciences - Physics, Chemistry, Biology",
          color: "#059669",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "sc1",
                  name: "Physics Lab 1",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "sc2",
                  name: "Physics Lab 2",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "sc3",
                  name: "Physics Prep Room",
                  type: "storage",
                  capacity: 5,
                },
                {
                  id: "sc4",
                  name: "Faculty Room",
                  type: "office",
                  capacity: 10,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "sc5",
                  name: "Chemistry Lab 1",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "sc6",
                  name: "Chemistry Lab 2",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "sc7",
                  name: "Chemical Storage",
                  type: "storage",
                  capacity: 3,
                },
                {
                  id: "sc8",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 5,
                },
              ],
            },
          ],
        },
        {
          name: "College of Arts & Sciences",
          type: "academic",
          description: "Arts, Social Sciences, Humanities",
          color: "#7C3AED",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "cas1",
                  name: "Psychology Lab",
                  type: "laboratory",
                  capacity: 25,
                },
                {
                  id: "cas2",
                  name: "Communication Room",
                  type: "classroom",
                  capacity: 35,
                },
                {
                  id: "cas3",
                  name: "Political Science Room",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "cas4",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 6,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "cas5",
                  name: "Lecture Hall",
                  type: "lecture",
                  capacity: 60,
                },
                {
                  id: "cas6",
                  name: "Social Work Lab",
                  type: "laboratory",
                  capacity: 25,
                },
                {
                  id: "cas7",
                  name: "Faculty Room",
                  type: "office",
                  capacity: 12,
                },
                {
                  id: "cas8",
                  name: "Research Center",
                  type: "office",
                  capacity: 10,
                },
              ],
            },
          ],
        },
        {
          name: "College of Criminal Justice",
          type: "academic",
          description: "Criminal Justice Education - Criminology",
          color: "#4B5563",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "crim1",
                  name: "Mock Courtroom",
                  type: "classroom",
                  capacity: 50,
                },
                {
                  id: "crim2",
                  name: "Forensic Lab",
                  type: "laboratory",
                  capacity: 25,
                },
                {
                  id: "crim3",
                  name: "Police Science Room",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "crim4",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 5,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "crim5",
                  name: "Lecture Hall",
                  type: "lecture",
                  capacity: 60,
                },
                {
                  id: "crim6",
                  name: "Criminology Lab",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "crim7",
                  name: "Faculty Room",
                  type: "office",
                  capacity: 10,
                },
              ],
            },
          ],
        },
        {
          name: "College of Tourism & Hospitality",
          type: "academic",
          description: "Hospitality and Tourism Management",
          color: "#F59E0B",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "th1",
                  name: "Hotel Lab / Mini Hotel",
                  type: "laboratory",
                  capacity: 30,
                },
                {
                  id: "th2",
                  name: "Culinary Kitchen",
                  type: "laboratory",
                  capacity: 25,
                },
                {
                  id: "th3",
                  name: "Food & Beverage Lab",
                  type: "laboratory",
                  capacity: 25,
                },
                {
                  id: "th4",
                  name: "Dean's Office",
                  type: "office",
                  capacity: 5,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "th5",
                  name: "Tourism Classroom",
                  type: "classroom",
                  capacity: 40,
                },
                {
                  id: "th6",
                  name: "Event Management Room",
                  type: "classroom",
                  capacity: 35,
                },
                {
                  id: "th7",
                  name: "Faculty Room",
                  type: "office",
                  capacity: 8,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      category: "Facilities & Amenities",
      items: [
        {
          name: "Main Library",
          type: "facility",
          description: "Central Library - Digital resources, study areas",
          color: "#DAA520",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "lib1",
                  name: "Circulation Desk",
                  type: "lobby",
                  capacity: 5,
                },
                {
                  id: "lib2",
                  name: "New Arrivals Section",
                  type: "reading",
                  capacity: 30,
                },
                {
                  id: "lib3",
                  name: "Computer Stations",
                  type: "computer",
                  capacity: 40,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "lib4",
                  name: "Reading Area A",
                  type: "reading",
                  capacity: 60,
                },
                {
                  id: "lib5",
                  name: "Reading Area B",
                  type: "reading",
                  capacity: 60,
                },
                {
                  id: "lib6",
                  name: "Quiet Zone",
                  type: "reading",
                  capacity: 40,
                },
              ],
            },
            {
              name: "2nd Floor",
              rooms: [
                {
                  id: "lib7",
                  name: "Digital Archive",
                  type: "storage",
                  capacity: 10,
                },
                {
                  id: "lib8",
                  name: "Research Center",
                  type: "reading",
                  capacity: 30,
                },
                {
                  id: "lib9",
                  name: "Group Study 1",
                  type: "meeting",
                  capacity: 10,
                },
                {
                  id: "lib10",
                  name: "Group Study 2",
                  type: "meeting",
                  capacity: 10,
                },
              ],
            },
          ],
        },
        {
          name: "Gymnasium / Sports Center",
          type: "facility",
          description: "Indoor sports and fitness facilities",
          color: "#DC2626",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "gym1", name: "Main Court", type: "gym", capacity: 500 },
                {
                  id: "gym2",
                  name: "Bleachers",
                  type: "seating",
                  capacity: 300,
                },
                {
                  id: "gym3",
                  name: "Equipment Room",
                  type: "storage",
                  capacity: 5,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                { id: "gym4", name: "Fitness Gym", type: "gym", capacity: 50 },
                {
                  id: "gym5",
                  name: "Locker Room M",
                  type: "locker",
                  capacity: 30,
                },
                {
                  id: "gym6",
                  name: "Locker Room F",
                  type: "locker",
                  capacity: 30,
                },
                {
                  id: "gym7",
                  name: "Trainer's Office",
                  type: "office",
                  capacity: 3,
                },
              ],
            },
          ],
        },
        {
          name: "Student Center / Cafeteria",
          type: "facility",
          description: "Food court, dining, and student activities",
          color: "#EA580C",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "sc1",
                  name: "Main Dining Area",
                  type: "dining",
                  capacity: 200,
                },
                {
                  id: "sc2",
                  name: "Fast Food Area",
                  type: "dining",
                  capacity: 80,
                },
                {
                  id: "sc3",
                  name: "Coffee Shop",
                  type: "dining",
                  capacity: 40,
                },
                {
                  id: "sc4",
                  name: "Student Council Office",
                  type: "office",
                  capacity: 8,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                { id: "sc5", name: "VIP Dining", type: "dining", capacity: 50 },
                {
                  id: "sc6",
                  name: "Function Hall",
                  type: "event",
                  capacity: 150,
                },
                { id: "sc7", name: "Kitchen", type: "kitchen", capacity: 20 },
                {
                  id: "sc8",
                  name: "Storage Room",
                  type: "storage",
                  capacity: 10,
                },
              ],
            },
          ],
        },
        {
          name: "Administration Building",
          type: "admin",
          description: "Main Administration - Registrar, Finance, President",
          color: "#A0522D",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "admin1",
                  name: "Guard House",
                  type: "security",
                  capacity: 4,
                },
                {
                  id: "admin2",
                  name: "Information Desk",
                  type: "lobby",
                  capacity: 5,
                },
                {
                  id: "admin3",
                  name: "Waiting Area",
                  type: "lobby",
                  capacity: 30,
                },
                { id: "admin4", name: "Cashier", type: "office", capacity: 4 },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "admin5",
                  name: "Registrar Office",
                  type: "office",
                  capacity: 12,
                },
                {
                  id: "admin6",
                  name: "Finance Office",
                  type: "office",
                  capacity: 10,
                },
                {
                  id: "admin7",
                  name: "Admission Office",
                  type: "office",
                  capacity: 8,
                },
              ],
            },
            {
              name: "2nd Floor",
              rooms: [
                {
                  id: "admin8",
                  name: "President's Office",
                  type: "office",
                  capacity: 6,
                },
                {
                  id: "admin9",
                  name: "Vice President",
                  type: "office",
                  capacity: 4,
                },
                {
                  id: "admin10",
                  name: "Board Room",
                  type: "meeting",
                  capacity: 25,
                },
              ],
            },
          ],
        },
        {
          name: "Grand Auditorium",
          type: "facility",
          description: "Events hall, concerts, assemblies",
          color: "#65A30D",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "aud1", name: "Main Stage", type: "stage", capacity: 50 },
                {
                  id: "aud2",
                  name: "Audience Seating",
                  type: "auditorium",
                  capacity: 500,
                },
                {
                  id: "aud3",
                  name: "Control Room",
                  type: "technical",
                  capacity: 5,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "aud4",
                  name: "VIP Lounge",
                  type: "lounge",
                  capacity: 30,
                },
                {
                  id: "aud5",
                  name: "Green Room",
                  type: "lounge",
                  capacity: 15,
                },
                { id: "aud6", name: "Storage", type: "storage", capacity: 10 },
              ],
            },
          ],
        },
        {
          name: "Dormitory - Male",
          type: "residential",
          description: "Male Student Housing",
          color: "#0891B2",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "dm1", name: "Lobby", type: "lobby", capacity: 15 },
                {
                  id: "dm2",
                  name: "Dorm Manager Office",
                  type: "office",
                  capacity: 3,
                },
                {
                  id: "dm3",
                  name: "Common Room",
                  type: "lounge",
                  capacity: 30,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                { id: "dm4", name: "Room 101", type: "dorm", capacity: 4 },
                { id: "dm5", name: "Room 102", type: "dorm", capacity: 4 },
                { id: "dm6", name: "Room 103", type: "dorm", capacity: 4 },
                { id: "dm7", name: "Room 104", type: "dorm", capacity: 4 },
                { id: "dm8", name: "Bathroom", type: "bath", capacity: 8 },
              ],
            },
            {
              name: "2nd Floor",
              rooms: [
                { id: "dm9", name: "Room 201", type: "dorm", capacity: 4 },
                { id: "dm10", name: "Room 202", type: "dorm", capacity: 4 },
                { id: "dm11", name: "Room 203", type: "dorm", capacity: 4 },
                { id: "dm12", name: "Room 204", type: "dorm", capacity: 4 },
                { id: "dm13", name: "Bathroom", type: "bath", capacity: 8 },
              ],
            },
          ],
        },
        {
          name: "Dormitory - Female",
          type: "residential",
          description: "Female Student Housing",
          color: "#DB2777",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "df1", name: "Lobby", type: "lobby", capacity: 15 },
                {
                  id: "df2",
                  name: "Dorm Manager Office",
                  type: "office",
                  capacity: 3,
                },
                {
                  id: "df3",
                  name: "Common Room",
                  type: "lounge",
                  capacity: 30,
                },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                { id: "df4", name: "Room 101", type: "dorm", capacity: 4 },
                { id: "df5", name: "Room 102", type: "dorm", capacity: 4 },
                { id: "df6", name: "Room 103", type: "dorm", capacity: 4 },
                { id: "df7", name: "Room 104", type: "dorm", capacity: 4 },
                { id: "df8", name: "Bathroom", type: "bath", capacity: 8 },
              ],
            },
            {
              name: "2nd Floor",
              rooms: [
                { id: "df9", name: "Room 201", type: "dorm", capacity: 4 },
                { id: "df10", name: "Room 202", type: "dorm", capacity: 4 },
                { id: "df11", name: "Room 203", type: "dorm", capacity: 4 },
                { id: "df12", name: "Room 204", type: "dorm", capacity: 4 },
                { id: "df13", name: "Bathroom", type: "bath", capacity: 8 },
              ],
            },
          ],
        },
        {
          name: "Computer Laboratory",
          type: "academic",
          description: "General computer labs for all students",
          color: "#3B82F6",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "cl1",
                  name: "Lab 1",
                  type: "computer",
                  capacity: 30,
                  computers: 30,
                },
                {
                  id: "cl2",
                  name: "Lab 2",
                  type: "computer",
                  capacity: 30,
                  computers: 30,
                },
                { id: "cl3", name: "Server Room", type: "server", capacity: 3 },
              ],
            },
            {
              name: "1st Floor",
              rooms: [
                {
                  id: "cl4",
                  name: "Lab 3",
                  type: "computer",
                  capacity: 25,
                  computers: 25,
                },
                {
                  id: "cl5",
                  name: "Lab 4",
                  type: "computer",
                  capacity: 25,
                  computers: 25,
                },
                {
                  id: "cl6",
                  name: "IT Support Office",
                  type: "office",
                  capacity: 8,
                },
              ],
            },
          ],
        },
        {
          name: "Chapel / Prayer Room",
          type: "facility",
          description: "Spiritual activities and meditation",
          color: "#E5E7EB",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "chap1",
                  name: "Main Chapel",
                  type: "auditorium",
                  capacity: 100,
                },
                {
                  id: "chap2",
                  name: "Prayer Room",
                  type: "reading",
                  capacity: 30,
                },
              ],
            },
          ],
        },
        {
          name: "Health Services / Clinic",
          type: "facility",
          description: "Medical clinic and first aid",
          color: "#10B981",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "clinic1",
                  name: "Reception",
                  type: "lobby",
                  capacity: 5,
                },
                {
                  id: "clinic2",
                  name: "Consultation Room",
                  type: "office",
                  capacity: 3,
                },
                {
                  id: "clinic3",
                  name: "First Aid Room",
                  type: "office",
                  capacity: 4,
                },
                {
                  id: "clinic4",
                  name: "Nurse's Office",
                  type: "office",
                  capacity: 2,
                },
              ],
            },
          ],
        },
        {
          name: "Canteen",
          type: "facility",
          description: "Student cafeteria and food stalls",
          color: "#F97316",
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "cant1",
                  name: "Dining Area",
                  type: "dining",
                  capacity: 100,
                },
                { id: "cant2", name: "Kitchen", type: "kitchen", capacity: 10 },
              ],
            },
          ],
        },
        {
          name: "Comfort Room (CR)",
          type: "facility",
          description: "Public restrooms",
          color: "#38BDF8",
          scale: [1.5, 0.5, 1.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "cr1", name: "Male CR", type: "bath", capacity: 5 },
                { id: "cr2", name: "Female CR", type: "bath", capacity: 5 },
              ],
            },
          ],
        },
      ],
    },
    {
      category: "Outdoor & Recreation",
      items: [
        {
          name: "Main Gate (Arch)",
          type: "feature",
          description: "Main campus entrance arch",
          color: "#8B4513",
          scale: [6, 3, 0.5],
          modelType: "archGate",
        },
        {
          name: "Main Gate (Pillar)",
          type: "feature",
          description: "Main entrance with pillars",
          color: "#F5F5DC",
          scale: [8, 4, 1],
          modelType: "pillarGate",
        },
        {
          name: "Side Gate",
          type: "feature",
          description: "Campus side entrance",
          color: "#4B5563",
          scale: [4, 2.5, 0.3],
          modelType: "simpleGate",
        },
        {
          name: "Back Gate",
          type: "feature",
          description: "Campus back entrance",
          color: "#6B7280",
          scale: [4, 2.5, 0.3],
          modelType: "simpleGate",
        },
        {
          name: "Gate House",
          type: "feature",
          description: "Security gate house",
          color: "#1F2937",
          scale: [3, 2.5, 2.5],
          modelType: "gateHouse",
        },
        {
          name: "Flag Pole",
          type: "feature",
          description: "Flag pole with school flag",
          color: "#FBBF24",
          scale: [0.3, 4, 0.3],
        },
        {
          name: "Open Basketball Court",
          type: "feature",
          description: "Outdoor basketball court",
          color: "#B91C1C",
          scale: [4, 0.3, 3],
        },
        {
          name: "Swimming Pool",
          type: "feature",
          description: "Olympic size swimming pool",
          color: "#06B6D4",
          scale: [6, 0.5, 3],
        },
        {
          name: "Tennis Court",
          type: "feature",
          description: "Outdoor tennis court",
          color: "#84CC16",
          scale: [2.5, 0.2, 4],
        },
        {
          name: "Running Track",
          type: "feature",
          description: "400 meter athletic track",
          color: "#92400E",
          scale: [8, 0.1, 5],
        },
        {
          name: "Central Plaza",
          type: "feature",
          description: "Central open plaza / quad",
          color: "#A8A29E",
          scale: [5, 0.1, 5],
        },
        {
          name: "Tree Avenue",
          type: "feature",
          description: "Trees lined pathway",
          color: "#166534",
          scale: [1, 3, 8],
        },
        {
          name: "Botanical Garden",
          type: "feature",
          description: "Landscaped botanical garden",
          color: "#22C55E",
          scale: [4, 0.5, 4],
        },
        {
          name: "Fountain",
          type: "feature",
          description: "Decorative fountain",
          color: "#0EA5E9",
          scale: [2, 1, 2],
        },
        {
          name: "Parking Lot A",
          type: "feature",
          description: "Vehicle parking area - Main",
          color: "#374151",
          scale: [6, 0.2, 5],
        },
        {
          name: "Parking Lot B",
          type: "feature",
          description: "Vehicle parking area - Secondary",
          color: "#4B5563",
          scale: [4, 0.2, 3],
        },
        {
          name: "Waiting Shed",
          type: "feature",
          description: "Student waiting area / shed",
          color: "#78716C",
          scale: [2, 0.8, 1.5],
        },
        {
          name: "Bleachers (Outdoor)",
          type: "feature",
          description: "Outdoor sports bleachers",
          color: "#9CA3AF",
          scale: [5, 1, 2],
        },
        {
          name: "Storage Shed",
          type: "feature",
          description: "Maintenance storage",
          color: "#6B7280",
          scale: [2, 1, 2],
        },
      ],
    },
    {
      category: "Realistic Walls & Fences",
      items: [
        {
          name: "Concrete Wall",
          type: "wall",
          description: "Concrete perimeter wall",
          color: "#9CA3AF",
          scale: [10, 2.5, 0.3],
          modelType: "concreteWall",
        },
        {
          name: "Concrete Wall (Short)",
          type: "wall",
          description: "Low concrete wall",
          color: "#9CA3AF",
          scale: [10, 1.2, 0.2],
          modelType: "concreteWall",
        },
        {
          name: "Brick Wall",
          type: "wall",
          description: "Red brick wall",
          color: "#8B4513",
          scale: [10, 2.5, 0.3],
          modelType: "brickWall",
        },
        {
          name: "Brick Wall (Short)",
          type: "wall",
          description: "Low brick wall",
          color: "#8B4513",
          scale: [10, 1.2, 0.2],
          modelType: "brickWall",
        },
        {
          name: "Stone Wall",
          type: "wall",
          description: "Natural stone wall",
          color: "#6B6B6B",
          scale: [10, 2.5, 0.5],
          modelType: "stoneWall",
        },
        {
          name: "Cinder Block Wall",
          type: "wall",
          description: "Cinder block wall",
          color: "#4B4B4B",
          scale: [10, 2, 0.3],
          modelType: "cinderWall",
        },
        {
          name: "Wood Fence",
          type: "wall",
          description: "Wooden fence",
          color: "#9B7B5B",
          scale: [10, 1.2, 0.1],
          modelType: "woodFence",
        },
        {
          name: "Picket Fence",
          type: "wall",
          description: "White picket fence",
          color: "#E6E6E6",
          scale: [10, 1, 0.1],
          modelType: "picketFence",
        },
        {
          name: "Chain Link Fence",
          type: "wall",
          description: "Metal chain link fence",
          color: "#3D3D3D",
          scale: [10, 1.8, 0.1],
          modelType: "chainLinkFence",
        },
        {
          name: "Wrought Iron Fence",
          type: "wall",
          description: "Black wrought iron fence",
          color: "#1A1A1A",
          scale: [10, 1.5, 0.2],
          modelType: "wroughtIronFence",
        },
        {
          name: "Hedge (Tall)",
          type: "wall",
          description: "Tall green hedge",
          color: "#228B22",
          scale: [10, 2, 1],
          modelType: "hedge",
        },
        {
          name: "Hedge (Short)",
          type: "wall",
          description: "Low decorative hedge",
          color: "#228B22",
          scale: [10, 1, 0.8],
          modelType: "hedge",
        },
      ],
    },
    {
      category: "Realistic Gates",
      items: [
        {
          name: "Main Gate (Modern)",
          type: "gate",
          description: "Modern sliding main gate",
          color: "#2B2B2B",
          scale: [8, 2.5, 0.3],
          modelType: "modernGate",
        },
        {
          name: "Main Gate (Classic)",
          type: "gate",
          description: "Classic arch gate",
          color: "#F5F5DC",
          scale: [10, 4, 1],
          modelType: "classicGate",
        },
        {
          name: "Double Gate (Modern)",
          type: "gate",
          description: "Modern double swing gate",
          color: "#1A3A1A",
          scale: [8, 2.5, 0.4],
          modelType: "doubleGateModern",
        },
        {
          name: "Double Gate (Classic)",
          type: "gate",
          description: "Classic double gate with pillars",
          color: "#B8A080",
          scale: [10, 3.5, 0.8],
          modelType: "doubleGateClassic",
        },
        {
          name: "Double Gate (Steel)",
          type: "gate",
          description: "Heavy steel double gate",
          color: "#4A4A4A",
          scale: [8, 2.5, 0.35],
          modelType: "doubleGateSteel",
        },
        {
          name: "Pedestrian Gate",
          type: "gate",
          description: "Person gate/door",
          color: "#4B4B4B",
          scale: [1.5, 2.2, 0.15],
          modelType: "pedestrianGate",
        },
        {
          name: "Wooden Gate",
          type: "gate",
          description: "Wooden garden gate",
          color: "#8B6914",
          scale: [3, 2, 0.2],
          modelType: "woodenGate",
        },
        {
          name: "Steel Gate",
          type: "gate",
          description: "Heavy steel gate",
          color: "#3D3D3D",
          scale: [6, 2.5, 0.3],
          modelType: "steelGate",
        },
        {
          name: "Sliding Gate",
          type: "gate",
          description: "Automatic sliding gate",
          color: "#5B5B5B",
          scale: [8, 2.2, 0.4],
          modelType: "slidingGate",
        },
        {
          name: "Swing Gate (Double)",
          type: "gate",
          description: "Double swing gate",
          color: "#2B5B2B",
          scale: [6, 2.5, 0.3],
          modelType: "swingGateDouble",
        },
        {
          name: "Guard Booth",
          type: "gate",
          description: "Security guard booth",
          color: "#4B5563",
          scale: [3, 2.5, 2.5],
          modelType: "guardBooth",
        },
        {
          name: "Gate with Wall",
          type: "gate",
          description: "Gate with wall sections",
          color: "#9CA3AF",
          scale: [12, 2.5, 0.3],
          modelType: "gateWithWall",
        },
        {
          name: "Boom Barrier",
          type: "gate",
          description: "Vehicle boom barrier",
          color: "#FFA500",
          scale: [4, 0.8, 0.2],
          modelType: "boomBarrier",
        },
      ],
    },
    {
      category: "Long Buildings (Customizable)",
      items: [
        {
          name: "Custom Long Building",
          type: "long_building",
          description:
            "Fully customizable long building with rooms on both sides of corridor",
          color: "#6366F1",
          scale: [3, 1, 1.5],
          corridorWidth: 3,
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "l1", name: "Room 101", type: "classroom", capacity: 40 },
              ],
            },
          ],
        },
        {
          name: "Dormitory (Long)",
          type: "long_building",
          description: "Long dormitory with corridor and rooms on both sides",
          color: "#DEB887",
          scale: [2, 0.8, 1.2],
          corridorWidth: 3,
        },
        {
          name: "Dormitory (Short)",
          type: "long_building",
          description: "Short dormitory with corridor and rooms",
          color: "#DEB887",
          scale: [1.5, 0.8, 1],
          corridorWidth: 2.5,
        },
        {
          name: "Laboratory Building",
          type: "long_building",
          description: "Long building with labs on both sides of corridor",
          color: "#10B981",
          scale: [2.5, 0.8, 1.5],
          corridorWidth: 3,
        },
        {
          name: "Classroom Building",
          type: "long_building",
          description: "Long classroom building with corridor and classrooms",
          color: "#3B82F6",
          scale: [2, 0.8, 1.2],
          corridorWidth: 3,
        },
        {
          name: "Office Building",
          type: "long_building",
          description: "Long office building with offices on both sides",
          color: "#F59E0B",
          scale: [1.8, 0.8, 1],
          corridorWidth: 2.5,
        },
        {
          name: "Hotel Building",
          type: "long_building",
          description: "Long hotel building with rooms along corridor",
          color: "#8B5CF6",
          scale: [3, 1, 1.5],
          corridorWidth: 2,
        },
      ],
    },
    {
      category: "Roads & Pathways",
      items: [
        {
          name: "Highway",
          type: "highway",
          description: "Major highway/arterial road",
          color: "#1F2937",
          width: 12,
        },
        {
          name: "Main Road",
          type: "road",
          description: "Main driveway through campus",
          color: "#374151",
        },
        {
          name: "Service Road",
          type: "road",
          description: "Service/utility road",
          color: "#4B5563",
        },
        {
          name: "Pedestrian Walkway",
          type: "path",
          description: "Concrete pedestrian path",
          color: "#9CA3AF",
        },
        {
          name: "Garden Path",
          type: "path",
          description: "Paved path through gardens",
          color: "#A8A29E",
        },
        {
          name: "Railway",
          type: "railway",
          description: "Train tracks bordering campus",
          color: "#1F2937",
        },
      ],
    },
    {
      category: "Navigation Points (Waypoints)",
      items: [
        {
          name: "Entrance Point",
          type: "navPoint",
          description: "Main entrance waypoint",
          color: "#10B981",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "np1",
                  name: "Main Entrance",
                  type: "entrance",
                  capacity: 0,
                },
              ],
            },
          ],
        },
        {
          name: "Intersection Point",
          type: "navPoint",
          description: "Path intersection waypoint",
          color: "#F59E0B",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "np2",
                  name: "Intersection",
                  type: "junction",
                  capacity: 0,
                },
              ],
            },
          ],
        },
        {
          name: "Exit Point",
          type: "navPoint",
          description: "Exit waypoint",
          color: "#EF4444",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [{ id: "np3", name: "Exit", type: "exit", capacity: 0 }],
            },
          ],
        },
        {
          name: "Meeting Point",
          type: "navPoint",
          description: "Meeting point or gathering spot",
          color: "#8B5CF6",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                {
                  id: "np4",
                  name: "Meeting Point",
                  type: "meeting",
                  capacity: 10,
                },
              ],
            },
          ],
        },
        {
          name: "Information Point",
          type: "navPoint",
          description: "Information or help desk",
          color: "#3B82F6",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "np5", name: "Info Desk", type: "info", capacity: 2 },
              ],
            },
          ],
        },
        {
          name: "Landmark Point",
          type: "navPoint",
          description: "Notable landmark or reference point",
          color: "#EC4899",
          scale: [0.5, 0.5, 0.5],
          floors: [
            {
              name: "Ground Floor",
              rooms: [
                { id: "np6", name: "Landmark", type: "landmark", capacity: 0 },
              ],
            },
          ],
        },
      ],
    },
  ];

  return (
    <div
      className="main-content"
      style={{ marginLeft: 0, height: "100vh", overflow: "hidden" }}
    >
      <CampusMap
        onBuildingSelect={handleBuildingSelect}
        selectedBuilding={selectedBuilding}
        adminMode={true}
        onDragEnd={handleDragEnd}
        showGrid={showGrid}
        gridSize={gridSize}
        selectedPath={selectedPath}
        onSelectPath={handlePathSelect}
        onPathPointDrag={handlePathPointDrag}
        selectedPointIndex={selectedPointIndex}
        onPointSelect={handlePointSelect}
        creativeMode={creativeMode}
        rulerMode={rulerMode}
        rulerPoints={rulerPoints}
        onRulerPointClick={handleRulerPointClick}
        draggedResource={draggedResource}
        onDropResource={(position) => {
          if (draggedResource) {
            handleAddElement({ ...draggedResource, position });
            setDraggedResource(null);
          }
        }}
      />

      <div className="glass map-builder-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Map Builder</h3>
          <span
            className="badge"
            style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}
          >
            Admin Mode
          </span>
          {creativeMode && (
            <span
              className="badge"
              style={{
                background: "rgba(16,185,129,0.3)",
                color: "#10b981",
                border: "1px solid #10b981",
              }}
            >
              <Box size={12} style={{ marginRight: 4 }} /> Creative
            </span>
          )}
          {rulerMode && (
            <span
              className="badge"
              style={{
                background: "rgba(139,92,246,0.3)",
                color: "#8B5CF6",
                border: "1px solid #8B5CF6",
              }}
            >
              <Ruler size={12} style={{ marginRight: 4 }} />
              {rulerPoints.length > 0
                ? `${calculateRulerDistance(rulerPoints)}m`
                : "Click to measure"}
            </span>
          )}
          <div
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 6,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MapPin size={12} style={{ color: "#3B82F6" }} />
            <span
              style={{ fontSize: "0.8rem", color: "#3B82F6", fontWeight: 500 }}
            >
              {currentMapName}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
              ({markers.length} buildings)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${showGrid ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid3X3 size={16} />
          </button>

          <button
            className={`btn btn-sm ${snapToGrid ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Snap to Grid"
          >
            <Move size={16} />
          </button>

          <button
            className={`btn btn-sm ${creativeMode ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setCreativeMode(!creativeMode)}
            title="Creative Mode - Free Movement"
            style={
              creativeMode
                ? { background: "#10b981", borderColor: "#10b981" }
                : {}
            }
          >
            <Box size={16} />
            Creative
          </button>

          <button
            className={`btn btn-sm ${rulerMode ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setRulerMode(!rulerMode);
              setRulerPoints([]);
            }}
            title="Ruler Mode - Measure Distance"
            style={
              rulerMode ? { background: "#8B5CF6", borderColor: "#8B5CF6" } : {}
            }
          >
            <Ruler size={16} />
            Ruler
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "0 8px",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Grid:
            </span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              disabled={creativeMode}
              style={{
                background: "transparent",
                border: "none",
                color: creativeMode ? "var(--text-muted)" : "var(--text)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <option value={1}>1m</option>
              <option value={5}>5m</option>
              <option value={10}>10m</option>
              <option value={20}>20m</option>
            </select>
          </div>

          <div
            style={{
              width: 1,
              height: 24,
              background: "var(--glass-border)",
              margin: "0 8px",
            }}
          />

          <button
            className="btn btn-sm btn-secondary"
            onClick={handleReset}
            title="Reset to Default"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              useStore.getState().loadUMMatinaCampus();
              setNotification({
                type: "success",
                message: "Campus loaded!",
              });
              setTimeout(() => setNotification(null), 2000);
            }}
            title="Load Campus"
          >
            <Save size={16} />
            Load Campus
          </button>

          <button
            className="btn btn-sm btn-primary"
            onClick={handleAutoConnectPaths}
            title="Auto-connect buildings to path network"
            style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}
          >
            <Link size={16} />
            Connect Paths
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={autoConnectBuildings}
            title="Add entrance waypoints to buildings"
          >
            <MapPin size={16} />
            Waypoints
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => useStore.getState().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => useStore.getState().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              loadFromLocalStorage();
              setNotification({
                type: "success",
                message: "Restored from previous session!",
              });
              setTimeout(() => setNotification(null), 2000);
            }}
            title="Restore last session"
          >
            <RotateCcw size={16} />
          </button>

          <button
            className="btn btn-sm btn-danger"
            onClick={handleClear}
            title="Clear All"
          >
            <Trash2 size={16} />
            Clear
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowLoadModal(true)}
            title="Load Map"
          >
            <Download size={16} />
            Load
          </button>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowSaveModal(true)}
            title="Save Map"
          >
            <Save size={16} />
            Save
          </button>

          <div
            style={{
              width: 1,
              height: 24,
              background: "var(--glass-border)",
              margin: "0 8px",
            }}
          />

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowResourcesModal(true)}
            title="Add Resources"
          >
            <Plus size={16} />
            Resources
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleAddPath("path")}
            title="Add Path"
          >
            <Layers size={16} />
            Path
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleAddPath("railway")}
            title="Add Railway"
          >
            <Train size={16} />
            Railway
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`notification ${notification.type}`}
          style={{
            position: "fixed",
            top: 100,
            right: 24,
            zIndex: 200,
            background:
              notification.type === "success"
                ? "rgba(16,185,129,0.95)"
                : "rgba(59,130,246,0.95)",
            padding: "16px 24px",
            borderRadius: 8,
            color: "white",
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 300,
          }}
        >
          {notification.type === "success" ? (
            <Check size={20} />
          ) : (
            <Download size={20} />
          )}
          {notification.message}
        </div>
      )}

      {(selectedBuilding || selectedPath) && (
        <div
          className="glass building-panel"
          style={{ maxHeight: "calc(100vh - 120px)", overflow: "auto" }}
        >
          {selectedBuilding && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2>Building Editor</h2>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMove(-gridSize, 0)}
                >
                  <ArrowUp size={14} style={{ transform: "rotate(-90deg)" }} />{" "}
                  Left
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMove(0, -gridSize)}
                >
                  <ArrowUp size={14} /> Forward
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMove(0, gridSize)}
                >
                  <ArrowUp size={14} style={{ transform: "rotate(180deg)" }} />{" "}
                  Back
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMove(gridSize, 0)}
                >
                  Right{" "}
                  <ArrowUp size={14} style={{ transform: "rotate(90deg)" }} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={handleMoveUp}
                  style={{ gridColumn: "2" }}
                >
                  <ArrowUp size={14} /> Up (Stack)
                </button>
                <button className="btn btn-secondary" onClick={handleMoveDown}>
                  <ArrowUp size={14} style={{ transform: "rotate(180deg)" }} />{" "}
                  Down
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleRotateLeft}
                >
                  <RotateCw size={14} /> Rotate Left
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleRotateRight}
                >
                  Rotate Right{" "}
                  <RotateCw size={14} style={{ transform: "scaleX(-1)" }} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 12,
                    color: "#8B5CF6",
                  }}
                >
                  Free Rotation (Y-Axis)
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation = 0;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    0°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation = (selectedBuilding.rotation || 0) - 90;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    -90°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation = (selectedBuilding.rotation || 0) - 45;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    -45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation = (selectedBuilding.rotation || 0) + 45;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    +45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation = (selectedBuilding.rotation || 0) + 90;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    +90°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      const newRotation =
                        (selectedBuilding.rotation || 0) + 180;
                      updateBuildingRotation(selectedBuilding.id, newRotation);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRotation,
                      });
                      setBuildingForm({
                        ...buildingForm,
                        rotation: newRotation,
                      });
                    }}
                  >
                    +180°
                  </button>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={selectedBuilding.rotation || 0}
                  onChange={(e) => {
                    const newRotation = Number(e.target.value);
                    updateBuildingRotation(selectedBuilding.id, newRotation);
                    setSelectedBuilding({
                      ...selectedBuilding,
                      rotation: newRotation,
                    });
                    setBuildingForm({ ...buildingForm, rotation: newRotation });
                  }}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9CA3AF",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {selectedBuilding.rotation || 0}°自由旋转
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleRotateVertical(-15)}
                  title="Rotate Vertical (Pitch)"
                >
                  <RotateCw size={14} style={{ transform: "rotate(90deg)" }} />{" "}
                  Pitch Up
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleRotateVertical(15)}
                  title="Rotate Vertical (Pitch)"
                >
                  Pitch Down{" "}
                  <RotateCw size={14} style={{ transform: "rotate(-90deg)" }} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 12,
                    color: "#3B82F6",
                  }}
                >
                  Vertical Tilt (X-Axis)
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateVertical(-90)}
                  >
                    -90°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateVertical(-45)}
                  >
                    -45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateVertical(0)}
                  >
                    0°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateVertical(45)}
                  >
                    +45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateVertical(90)}
                  >
                    +90°
                  </button>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={selectedBuilding.rotationX || 0}
                  onChange={(e) => {
                    const newRotationX = Number(e.target.value);
                    const updates = { rotationX: newRotationX };
                    useStore
                      .getState()
                      .updateBuilding(selectedBuilding.id, updates);
                    setSelectedBuilding({ ...selectedBuilding, ...updates });
                    setBuildingForm({ ...buildingForm, ...updates });
                  }}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9CA3AF",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {selectedBuilding.rotationX || 0}°垂直倾斜
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleRotateTilt(-15)}
                  title="Tilt Left (Roll)"
                >
                  <RotateCw size={14} /> Tilt Left
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleRotateTilt(15)}
                  title="Tilt Right (Roll)"
                >
                  Tilt Right{" "}
                  <RotateCw size={14} style={{ transform: "scaleX(-1)" }} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 12,
                    color: "#10B981",
                  }}
                >
                  Horizontal Tilt (Z-Axis)
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateTilt(-90)}
                  >
                    -90°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateTilt(-45)}
                  >
                    -45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateTilt(0)}
                  >
                    0°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateTilt(45)}
                  >
                    +45°
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleRotateTilt(90)}
                  >
                    +90°
                  </button>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={selectedBuilding.rotationZ || 0}
                  onChange={(e) => {
                    const newRotationZ = Number(e.target.value);
                    const updates = { rotationZ: newRotationZ };
                    useStore
                      .getState()
                      .updateBuilding(selectedBuilding.id, updates);
                    setSelectedBuilding({ ...selectedBuilding, ...updates });
                    setBuildingForm({ ...buildingForm, ...updates });
                  }}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9CA3AF",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {selectedBuilding.rotationZ || 0}°水平倾斜
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className={`btn ${selectedBuilding?.locked ? "btn-danger" : "btn-secondary"}`}
                  style={{ flex: 1, fontWeight: 600 }}
                  onClick={handleToggleLock}
                >
                  {selectedBuilding?.locked ? (
                    <>🔒 Locked - Click to Unlock</>
                  ) : (
                    <>🔓 Unlocked - Click to Lock</>
                  )}
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleScaleDown}
                >
                  <Maximize2
                    size={14}
                    style={{ transform: "rotate(180deg)" }}
                  />{" "}
                  Shrink
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleScaleUp}
                >
                  <Maximize2 size={14} /> Grow
                </button>
              </div>

              {(selectedBuilding?.type === "wall" ||
                selectedBuilding?.type === "gate") && (
                <div
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "#8B5CF6",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Vertical Position (Y)
                  </label>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const currentY = buildingForm.position?.[1] || 0;
                        const newPos = [
                          buildingForm.position?.[0] || 0,
                          Math.max(0, currentY - 0.5),
                          buildingForm.position?.[2] || 0,
                        ];
                        setBuildingForm({ ...buildingForm, position: newPos });
                        updateBuildingPosition(selectedBuilding.id, newPos);
                        setSelectedBuilding({
                          ...selectedBuilding,
                          position: newPos,
                        });
                      }}
                    >
                      -0.5m
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const currentY = buildingForm.position?.[1] || 0;
                        const newPos = [
                          buildingForm.position?.[0] || 0,
                          Math.max(0, currentY - 1),
                          buildingForm.position?.[2] || 0,
                        ];
                        setBuildingForm({ ...buildingForm, position: newPos });
                        updateBuildingPosition(selectedBuilding.id, newPos);
                        setSelectedBuilding({
                          ...selectedBuilding,
                          position: newPos,
                        });
                      }}
                    >
                      -1m
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const newPos = [
                          buildingForm.position?.[0] || 0,
                          0,
                          buildingForm.position?.[2] || 0,
                        ];
                        setBuildingForm({ ...buildingForm, position: newPos });
                        updateBuildingPosition(selectedBuilding.id, newPos);
                        setSelectedBuilding({
                          ...selectedBuilding,
                          position: newPos,
                        });
                      }}
                    >
                      Ground
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const currentY = buildingForm.position?.[1] || 0;
                        const newPos = [
                          buildingForm.position?.[0] || 0,
                          currentY + 0.5,
                          buildingForm.position?.[2] || 0,
                        ];
                        setBuildingForm({ ...buildingForm, position: newPos });
                        updateBuildingPosition(selectedBuilding.id, newPos);
                        setSelectedBuilding({
                          ...selectedBuilding,
                          position: newPos,
                        });
                      }}
                    >
                      +0.5m
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const currentY = buildingForm.position?.[1] || 0;
                        const newPos = [
                          buildingForm.position?.[0] || 0,
                          currentY + 1,
                          buildingForm.position?.[2] || 0,
                        ];
                        setBuildingForm({ ...buildingForm, position: newPos });
                        updateBuildingPosition(selectedBuilding.id, newPos);
                        setSelectedBuilding({
                          ...selectedBuilding,
                          position: newPos,
                        });
                      }}
                    >
                      +1m
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Building Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={buildingForm.name}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, name: e.target.value })
                  }
                  onBlur={handleUpdateBuilding}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-select"
                  value={buildingForm.type}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, type: e.target.value })
                  }
                  onBlur={handleUpdateBuilding}
                >
                  <option value="academic">Academic</option>
                  <option value="facility">Facility</option>
                  <option value="residential">Residential</option>
                  <option value="admin">Admin</option>
                  <option value="feature">Feature</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={buildingForm.description}
                  onChange={(e) =>
                    setBuildingForm({
                      ...buildingForm,
                      description: e.target.value,
                    })
                  }
                  onBlur={handleUpdateBuilding}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label>X Position</label>
                  <input
                    type="number"
                    className="form-input"
                    value={Math.round(buildingForm.position?.[0] || 0)}
                    onChange={(e) => {
                      const newPos = [
                        Number(e.target.value),
                        buildingForm.position?.[1] || 0,
                        buildingForm.position?.[2] || 0,
                      ];
                      setBuildingForm({ ...buildingForm, position: newPos });
                      updateBuildingPosition(selectedBuilding.id, newPos);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        position: newPos,
                      });
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Y Position</label>
                  <input
                    type="number"
                    className="form-input"
                    value={Math.round(buildingForm.position?.[1] || 0)}
                    onChange={(e) => {
                      const newPos = [
                        buildingForm.position?.[0] || 0,
                        Number(e.target.value),
                        buildingForm.position?.[2] || 0,
                      ];
                      setBuildingForm({ ...buildingForm, position: newPos });
                      updateBuildingPosition(selectedBuilding.id, newPos);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        position: newPos,
                      });
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Z Position</label>
                  <input
                    type="number"
                    className="form-input"
                    value={Math.round(buildingForm.position?.[2] || 0)}
                    onChange={(e) => {
                      const newPos = [
                        buildingForm.position?.[0] || 0,
                        buildingForm.position?.[1] || 0,
                        Number(e.target.value),
                      ];
                      setBuildingForm({ ...buildingForm, position: newPos });
                      updateBuildingPosition(selectedBuilding.id, newPos);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        position: newPos,
                      });
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Rotation</label>
                  <input
                    type="number"
                    className="form-input"
                    value={Math.round(buildingForm.rotation || 0)}
                    onChange={(e) => {
                      const newRot = Number(e.target.value);
                      setBuildingForm({ ...buildingForm, rotation: newRot });
                      updateBuildingRotation(selectedBuilding.id, newRot);
                      setSelectedBuilding({
                        ...selectedBuilding,
                        rotation: newRot,
                      });
                    }}
                  />
                </div>
              </div>

              {(selectedBuilding?.type === "wall" ||
                selectedBuilding?.type === "gate" ||
                selectedBuilding?.modelType?.includes("Gate")) && (
                <>
                  <div
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        marginBottom: 12,
                        color: "#8B5CF6",
                      }}
                    >
                      <Maximize2 size={14} style={{ marginRight: 6 }} />{" "}
                      Wall/Gate Size (No Limits)
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Width (m)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={buildingForm.scale?.[0] || 10}
                          onChange={(e) => {
                            const newScale = [
                              Number(e.target.value) || 1,
                              buildingForm.scale?.[1] || 2.5,
                              buildingForm.scale?.[2] || 0.3,
                            ];
                            setBuildingForm({
                              ...buildingForm,
                              scale: newScale,
                            });
                            updateBuildingScale(selectedBuilding.id, newScale);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              scale: newScale,
                            });
                          }}
                          min={0.1}
                          step={0.5}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Height (m)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={buildingForm.scale?.[1] || 2.5}
                          onChange={(e) => {
                            const newScale = [
                              buildingForm.scale?.[0] || 10,
                              Number(e.target.value) || 0.1,
                              buildingForm.scale?.[2] || 0.3,
                            ];
                            setBuildingForm({
                              ...buildingForm,
                              scale: newScale,
                            });
                            updateBuildingScale(selectedBuilding.id, newScale);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              scale: newScale,
                            });
                          }}
                          min={0.1}
                          step={0.1}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Depth (m)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={buildingForm.scale?.[2] || 0.3}
                          onChange={(e) => {
                            const newScale = [
                              buildingForm.scale?.[0] || 10,
                              buildingForm.scale?.[1] || 2.5,
                              Number(e.target.value) || 0.1,
                            ];
                            setBuildingForm({
                              ...buildingForm,
                              scale: newScale,
                            });
                            updateBuildingScale(selectedBuilding.id, newScale);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              scale: newScale,
                            });
                          }}
                          min={0.1}
                          step={0.1}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Width Presets
                      </label>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {[5, 10, 20, 50, 100, 200, 500, 1000].map((w) => (
                          <button
                            key={w}
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const newScale = [
                                w,
                                buildingForm.scale?.[1] || 2.5,
                                buildingForm.scale?.[2] || 0.3,
                              ];
                              setBuildingForm({
                                ...buildingForm,
                                scale: newScale,
                              });
                              updateBuildingScale(
                                selectedBuilding.id,
                                newScale,
                              );
                              setSelectedBuilding({
                                ...selectedBuilding,
                                scale: newScale,
                              });
                            }}
                          >
                            {w}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Height Presets
                      </label>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20].map(
                          (h) => (
                            <button
                              key={h}
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                const newScale = [
                                  buildingForm.scale?.[0] || 10,
                                  h,
                                  buildingForm.scale?.[2] || 0.3,
                                ];
                                setBuildingForm({
                                  ...buildingForm,
                                  scale: newScale,
                                });
                                updateBuildingScale(
                                  selectedBuilding.id,
                                  newScale,
                                );
                                setSelectedBuilding({
                                  ...selectedBuilding,
                                  scale: newScale,
                                });
                              }}
                            >
                              {h}m
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Depth Presets
                      </label>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {[0.1, 0.2, 0.3, 0.5, 1, 1.5, 2, 3, 5].map((d) => (
                          <button
                            key={d}
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const newScale = [
                                buildingForm.scale?.[0] || 10,
                                buildingForm.scale?.[1] || 2.5,
                                d,
                              ];
                              setBuildingForm({
                                ...buildingForm,
                                scale: newScale,
                              });
                              updateBuildingScale(
                                selectedBuilding.id,
                                newScale,
                              );
                              setSelectedBuilding({
                                ...selectedBuilding,
                                scale: newScale,
                              });
                            }}
                          >
                            {d}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label
                      style={{
                        fontSize: "0.8rem",
                        color: "#8B5CF6",
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      Rotation Presets
                    </label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation = 0;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        0°
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation = 45;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        45°
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation = 90;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        90°
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation = -90;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        -90°
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation =
                            (selectedBuilding.rotation || 0) - 15;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        -15°
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const newRotation =
                            (selectedBuilding.rotation || 0) + 15;
                          updateBuildingRotation(
                            selectedBuilding.id,
                            newRotation,
                          );
                          setSelectedBuilding({
                            ...selectedBuilding,
                            rotation: newRotation,
                          });
                          setBuildingForm({
                            ...buildingForm,
                            rotation: newRotation,
                          });
                        }}
                      >
                        +15°
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedBuilding?.type === "long_building" && (
                <div
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: 12,
                      color: "#3B82F6",
                    }}
                  >
                    <Maximize2 size={14} style={{ marginRight: 6 }} /> Building
                    Size (No Limits)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Length (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[0] || 30}
                        onChange={(e) => {
                          const newScale = [
                            Number(e.target.value) || 1,
                            buildingForm.scale?.[1] || 4,
                            buildingForm.scale?.[2] || 15,
                          ];
                          const newForm = { ...buildingForm, scale: newScale };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Height (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[1] || 4}
                        onChange={(e) => {
                          const newScale = [
                            buildingForm.scale?.[0] || 30,
                            Number(e.target.value) || 0.1,
                            buildingForm.scale?.[2] || 15,
                          ];
                          const newForm = { ...buildingForm, scale: newScale };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Depth (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[2] || 15}
                        onChange={(e) => {
                          const newScale = [
                            buildingForm.scale?.[0] || 30,
                            buildingForm.scale?.[1] || 4,
                            Number(e.target.value) || 1,
                          ];
                          const newForm = { ...buildingForm, scale: newScale };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "#9CA3AF",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Length Presets
                    </label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[10, 20, 30, 50, 100, 150, 200, 500].map((l) => (
                        <button
                          key={l}
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            const newScale = [
                              l,
                              buildingForm.scale?.[1] || 4,
                              buildingForm.scale?.[2] || 15,
                            ];
                            const newForm = {
                              ...buildingForm,
                              scale: newScale,
                            };
                            setBuildingForm(newForm);
                            useStore
                              .getState()
                              .updateBuilding(selectedBuilding.id, newForm);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              ...newForm,
                            });
                          }}
                        >
                          {l}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <h4
                    style={{
                      fontSize: "0.8rem",
                      marginBottom: 8,
                      color: "#3B82F6",
                    }}
                  >
                    <Layers size={12} style={{ marginRight: 4 }} /> Floors &
                    Rooms
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Number of Floors</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.floors?.length || 1}
                        onChange={(e) => {
                          const numFloors = Math.max(
                            1,
                            Number(e.target.value) || 1,
                          );
                          const currentFloors = buildingForm.floors || [];
                          let newFloors = [...currentFloors];
                          while (newFloors.length < numFloors) {
                            const floorNum = newFloors.length + 1;
                            newFloors.push({
                              name: `Floor ${floorNum}`,
                              rooms: [
                                {
                                  id: `f${floorNum}r1`,
                                  name: `Room ${floorNum}01`,
                                  type: "classroom",
                                  capacity: 40,
                                },
                              ],
                            });
                          }
                          while (newFloors.length > numFloors) {
                            newFloors.pop();
                          }
                          const newForm = {
                            ...buildingForm,
                            floors: newFloors,
                          };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={1}
                        step={1}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Rooms per Side</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.roomsPerSide || 3}
                        onChange={(e) => {
                          const roomsPerSide = Math.max(
                            1,
                            Number(e.target.value) || 1,
                          );
                          const newForm = { ...buildingForm, roomsPerSide };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={1}
                        step={1}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Corridor Width (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.corridorWidth || 3}
                        onChange={(e) => {
                          const corridorWidth = Math.max(
                            0.5,
                            Number(e.target.value) || 1,
                          );
                          const newForm = { ...buildingForm, corridorWidth };
                          setBuildingForm(newForm);
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            ...newForm,
                          });
                        }}
                        min={0.5}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label
                      style={{
                        fontSize: "0.8rem",
                        marginBottom: 8,
                        color: "#3B82F6",
                        display: "block",
                      }}
                    >
                      Total: {buildingForm.floors?.length || 1} floors,{" "}
                      {(buildingForm.roomsPerSide || 3) *
                        2 *
                        (buildingForm.floors?.length || 1)}{" "}
                      rooms
                    </label>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid rgba(59,130,246,0.3)",
                      paddingTop: 12,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.8rem",
                        marginBottom: 8,
                        color: "#10B981",
                      }}
                    >
                      <Square size={12} style={{ marginRight: 4 }} /> Edit Rooms
                    </h4>
                    <div style={{ maxHeight: 200, overflow: "auto" }}>
                      {(buildingForm.floors || []).map((floor, floorIndex) => (
                        <div
                          key={floorIndex}
                          style={{
                            marginBottom: 12,
                            padding: 8,
                            background: "rgba(0,0,0,0.1)",
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <input
                              type="text"
                              className="form-input"
                              value={floor.name}
                              onChange={(e) => {
                                const newFloors = [
                                  ...(buildingForm.floors || []),
                                ];
                                newFloors[floorIndex] = {
                                  ...newFloors[floorIndex],
                                  name: e.target.value,
                                };
                                const newForm = {
                                  ...buildingForm,
                                  floors: newFloors,
                                };
                                setBuildingForm(newForm);
                                useStore
                                  .getState()
                                  .updateBuilding(selectedBuilding.id, newForm);
                                setSelectedBuilding({
                                  ...selectedBuilding,
                                  ...newForm,
                                });
                              }}
                              style={{ flex: 1, fontSize: "0.85rem" }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9CA3AF",
                              marginBottom: 4,
                            }}
                          >
                            Left Side Rooms:
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            {Array.from({
                              length: buildingForm.roomsPerSide || 3,
                            }).map((_, roomIndex) => {
                              const room = floor.rooms?.[roomIndex] || {
                                id: `f${floorIndex}r${roomIndex}`,
                                name: `Room ${floorIndex + 1}0${roomIndex + 1}`,
                                type: "classroom",
                                capacity: 40,
                              };
                              return (
                                <input
                                  key={`left-${roomIndex}`}
                                  type="text"
                                  className="form-input"
                                  value={room.name}
                                  placeholder={`Room ${floorIndex + 1}0${roomIndex + 1}`}
                                  onChange={(e) => {
                                    const newFloors = [
                                      ...(buildingForm.floors || []),
                                    ];
                                    const newRooms = [
                                      ...(newFloors[floorIndex].rooms || []),
                                    ];
                                    newRooms[roomIndex] = {
                                      ...newRooms[roomIndex],
                                      name: e.target.value,
                                    };
                                    newFloors[floorIndex] = {
                                      ...newFloors[floorIndex],
                                      rooms: newRooms,
                                    };
                                    const newForm = {
                                      ...buildingForm,
                                      floors: newFloors,
                                    };
                                    setBuildingForm(newForm);
                                    useStore
                                      .getState()
                                      .updateBuilding(
                                        selectedBuilding.id,
                                        newForm,
                                      );
                                    setSelectedBuilding({
                                      ...selectedBuilding,
                                      ...newForm,
                                    });
                                  }}
                                  style={{ width: 90, fontSize: "0.75rem" }}
                                />
                              );
                            })}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9CA3AF",
                              marginBottom: 4,
                              marginTop: 6,
                            }}
                          >
                            Right Side Rooms:
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            {Array.from({
                              length: buildingForm.roomsPerSide || 3,
                            }).map((_, roomIndex) => {
                              const roomIndexOffset =
                                (buildingForm.roomsPerSide || 3) + roomIndex;
                              const room = floor.rooms?.[roomIndexOffset] || {
                                id: `f${floorIndex}r${roomIndexOffset}`,
                                name: `Room ${floorIndex + 1}${String(roomIndex + 1).padStart(2, "0")}`,
                                type: "classroom",
                                capacity: 40,
                              };
                              return (
                                <input
                                  key={`right-${roomIndex}`}
                                  type="text"
                                  className="form-input"
                                  value={room.name}
                                  placeholder={`Room ${floorIndex + 1}${String(roomIndex + 1).padStart(2, "0")}`}
                                  onChange={(e) => {
                                    const newFloors = [
                                      ...(buildingForm.floors || []),
                                    ];
                                    const newRooms = [
                                      ...(newFloors[floorIndex].rooms || []),
                                    ];
                                    newRooms[roomIndexOffset] = {
                                      ...newRooms[roomIndexOffset],
                                      name: e.target.value,
                                    };
                                    newFloors[floorIndex] = {
                                      ...newFloors[floorIndex],
                                      rooms: newRooms,
                                    };
                                    const newForm = {
                                      ...buildingForm,
                                      floors: newFloors,
                                    };
                                    setBuildingForm(newForm);
                                    useStore
                                      .getState()
                                      .updateBuilding(
                                        selectedBuilding.id,
                                        newForm,
                                      );
                                    setSelectedBuilding({
                                      ...selectedBuilding,
                                      ...newForm,
                                    });
                                  }}
                                  style={{ width: 90, fontSize: "0.75rem" }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedBuilding?.type === "academic" && (
                <div
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: 12,
                      color: "#10B981",
                    }}
                  >
                    <Layers size={14} style={{ marginRight: 6 }} /> Floors &
                    Rooms
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Number of Floors</label>
                      <input
                        type="number"
                        className="form-input"
                        value={selectedBuilding?.floors?.length || 1}
                        onChange={(e) => {
                          const numFloors = Math.max(
                            1,
                            Number(e.target.value) || 1,
                          );
                          const currentFloors = selectedBuilding?.floors || [];
                          let newFloors = [...currentFloors];
                          while (newFloors.length < numFloors) {
                            const floorNum = newFloors.length + 1;
                            newFloors.push({
                              name: `Floor ${floorNum}`,
                              rooms: [
                                {
                                  id: `f${floorNum}r1`,
                                  name: `Room ${floorNum}01`,
                                  type: "classroom",
                                  capacity: 40,
                                },
                              ],
                            });
                          }
                          while (newFloors.length > numFloors) {
                            newFloors.pop();
                          }
                          const newForm = {
                            ...buildingForm,
                            floors: newFloors,
                          };
                          useStore
                            .getState()
                            .updateBuilding(selectedBuilding.id, newForm);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            floors: newFloors,
                          });
                          setBuildingForm(newForm);
                        }}
                        min={1}
                        step={1}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid rgba(16,185,129,0.3)",
                      paddingTop: 12,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.8rem",
                        marginBottom: 8,
                        color: "#10B981",
                      }}
                    >
                      <Square size={12} style={{ marginRight: 4 }} /> Edit Rooms
                    </h4>
                    <div style={{ maxHeight: 200, overflow: "auto" }}>
                      {(selectedBuilding?.floors || []).map(
                        (floor, floorIndex) => (
                          <div
                            key={floorIndex}
                            style={{
                              marginBottom: 12,
                              padding: 8,
                              background: "rgba(0,0,0,0.1)",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <input
                                type="text"
                                className="form-input"
                                value={floor.name}
                                onChange={(e) => {
                                  const newFloors = [
                                    ...(selectedBuilding?.floors || []),
                                  ];
                                  newFloors[floorIndex] = {
                                    ...newFloors[floorIndex],
                                    name: e.target.value,
                                  };
                                  const newForm = {
                                    ...buildingForm,
                                    floors: newFloors,
                                  };
                                  useStore
                                    .getState()
                                    .updateBuilding(
                                      selectedBuilding.id,
                                      newForm,
                                    );
                                  setSelectedBuilding({
                                    ...selectedBuilding,
                                    floors: newFloors,
                                  });
                                  setBuildingForm(newForm);
                                }}
                                style={{ flex: 1, fontSize: "0.85rem" }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {(floor.rooms || []).map((room, roomIndex) => (
                                <div
                                  key={roomIndex}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={room.name}
                                    onChange={(e) => {
                                      const newFloors = [
                                        ...(selectedBuilding?.floors || []),
                                      ];
                                      const newRooms = [
                                        ...(newFloors[floorIndex].rooms || []),
                                      ];
                                      newRooms[roomIndex] = {
                                        ...newRooms[roomIndex],
                                        name: e.target.value,
                                      };
                                      newFloors[floorIndex] = {
                                        ...newFloors[floorIndex],
                                        rooms: newRooms,
                                      };
                                      const newForm = {
                                        ...buildingForm,
                                        floors: newFloors,
                                      };
                                      useStore
                                        .getState()
                                        .updateBuilding(
                                          selectedBuilding.id,
                                          newForm,
                                        );
                                      setSelectedBuilding({
                                        ...selectedBuilding,
                                        floors: newFloors,
                                      });
                                      setBuildingForm(newForm);
                                    }}
                                    style={{ flex: 1, fontSize: "0.8rem" }}
                                    placeholder="Room Name"
                                  />
                                  <input
                                    type="number"
                                    className="form-input"
                                    value={room.capacity}
                                    onChange={(e) => {
                                      const newFloors = [
                                        ...(selectedBuilding?.floors || []),
                                      ];
                                      const newRooms = [
                                        ...(newFloors[floorIndex].rooms || []),
                                      ];
                                      newRooms[roomIndex] = {
                                        ...newRooms[roomIndex],
                                        capacity: Number(e.target.value) || 1,
                                      };
                                      newFloors[floorIndex] = {
                                        ...newFloors[floorIndex],
                                        rooms: newRooms,
                                      };
                                      const newForm = {
                                        ...buildingForm,
                                        floors: newFloors,
                                      };
                                      useStore
                                        .getState()
                                        .updateBuilding(
                                          selectedBuilding.id,
                                          newForm,
                                        );
                                      setSelectedBuilding({
                                        ...selectedBuilding,
                                        floors: newFloors,
                                      });
                                      setBuildingForm(newForm);
                                    }}
                                    style={{ width: 60, fontSize: "0.75rem" }}
                                    min={1}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedBuilding?.type === "navPoint" && (
                <div
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: 12,
                      color: "#10B981",
                    }}
                  >
                    <Layers size={14} style={{ marginRight: 6 }} /> Navigation
                    Point Settings
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {(selectedBuilding?.floors || []).map(
                      (floor, floorIndex) => (
                        <div
                          key={floorIndex}
                          style={{
                            padding: 8,
                            background: "rgba(0,0,0,0.1)",
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#9CA3AF",
                              marginBottom: 8,
                            }}
                          >
                            Floor: {floor.name}
                          </div>
                          {(floor.rooms || []).map((room, roomIndex) => (
                            <div
                              key={roomIndex}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <label
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#9CA3AF",
                                    display: "block",
                                    marginBottom: 2,
                                  }}
                                >
                                  Point Name
                                </label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={room.name}
                                  onChange={(e) => {
                                    const newFloors = [
                                      ...(selectedBuilding?.floors || []),
                                    ];
                                    const newRooms = [
                                      ...(newFloors[floorIndex].rooms || []),
                                    ];
                                    newRooms[roomIndex] = {
                                      ...newRooms[roomIndex],
                                      name: e.target.value,
                                    };
                                    newFloors[floorIndex] = {
                                      ...newFloors[floorIndex],
                                      rooms: newRooms,
                                    };
                                    const newForm = {
                                      ...buildingForm,
                                      floors: newFloors,
                                    };
                                    useStore
                                      .getState()
                                      .updateBuilding(
                                        selectedBuilding.id,
                                        newForm,
                                      );
                                    setSelectedBuilding({
                                      ...selectedBuilding,
                                      floors: newFloors,
                                    });
                                    setBuildingForm(newForm);
                                  }}
                                  style={{ fontSize: "0.85rem" }}
                                  placeholder="Point Name"
                                />
                              </div>
                              <div style={{ width: 120 }}>
                                <label
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#9CA3AF",
                                    display: "block",
                                    marginBottom: 2,
                                  }}
                                >
                                  Point Type
                                </label>
                                <select
                                  className="form-select"
                                  value={room.type || "waypoint"}
                                  onChange={(e) => {
                                    const newFloors = [
                                      ...(selectedBuilding?.floors || []),
                                    ];
                                    const newRooms = [
                                      ...(newFloors[floorIndex].rooms || []),
                                    ];
                                    newRooms[roomIndex] = {
                                      ...newRooms[roomIndex],
                                      type: e.target.value,
                                    };
                                    newFloors[floorIndex] = {
                                      ...newFloors[floorIndex],
                                      rooms: newRooms,
                                    };
                                    const newForm = {
                                      ...buildingForm,
                                      floors: newFloors,
                                    };
                                    useStore
                                      .getState()
                                      .updateBuilding(
                                        selectedBuilding.id,
                                        newForm,
                                      );
                                    setSelectedBuilding({
                                      ...selectedBuilding,
                                      floors: newFloors,
                                    });
                                    setBuildingForm(newForm);
                                  }}
                                  style={{ fontSize: "0.85rem" }}
                                >
                                  <option value="entrance">Entrance</option>
                                  <option value="junction">Junction</option>
                                  <option value="exit">Exit</option>
                                  <option value="meeting">Meeting Point</option>
                                  <option value="info">Info Desk</option>
                                  <option value="landmark">Landmark</option>
                                  <option value="waypoint">Waypoint</option>
                                </select>
                              </div>
                              <div style={{ width: 80 }}>
                                <label
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#9CA3AF",
                                    display: "block",
                                    marginBottom: 2,
                                  }}
                                >
                                  Capacity
                                </label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={room.capacity}
                                  onChange={(e) => {
                                    const newFloors = [
                                      ...(selectedBuilding?.floors || []),
                                    ];
                                    const newRooms = [
                                      ...(newFloors[floorIndex].rooms || []),
                                    ];
                                    newRooms[roomIndex] = {
                                      ...newRooms[roomIndex],
                                      capacity: Number(e.target.value) || 0,
                                    };
                                    newFloors[floorIndex] = {
                                      ...newFloors[floorIndex],
                                      rooms: newRooms,
                                    };
                                    const newForm = {
                                      ...buildingForm,
                                      floors: newFloors,
                                    };
                                    useStore
                                      .getState()
                                      .updateBuilding(
                                        selectedBuilding.id,
                                        newForm,
                                      );
                                    setSelectedBuilding({
                                      ...selectedBuilding,
                                      floors: newFloors,
                                    });
                                    setBuildingForm(newForm);
                                  }}
                                  style={{ fontSize: "0.85rem" }}
                                  min={0}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {selectedBuilding?.type !== "long_building" && (
                <div
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: 12,
                      color: "#3B82F6",
                    }}
                  >
                    <Maximize2 size={14} style={{ marginRight: 6 }} /> Size (No
                    Limits)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Width/Length (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[0] || 1}
                        onChange={(e) => {
                          const newScale = [
                            Number(e.target.value) || 0.1,
                            buildingForm.scale?.[1] || 1,
                            buildingForm.scale?.[2] || 1,
                          ];
                          setBuildingForm({ ...buildingForm, scale: newScale });
                          updateBuildingScale(selectedBuilding.id, newScale);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            scale: newScale,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Height (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[1] || 1}
                        onChange={(e) => {
                          const newScale = [
                            buildingForm.scale?.[0] || 1,
                            Number(e.target.value) || 0.1,
                            buildingForm.scale?.[2] || 1,
                          ];
                          setBuildingForm({ ...buildingForm, scale: newScale });
                          updateBuildingScale(selectedBuilding.id, newScale);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            scale: newScale,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Depth (m)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={buildingForm.scale?.[2] || 1}
                        onChange={(e) => {
                          const newScale = [
                            buildingForm.scale?.[0] || 1,
                            buildingForm.scale?.[1] || 1,
                            Number(e.target.value) || 0.1,
                          ];
                          setBuildingForm({ ...buildingForm, scale: newScale });
                          updateBuildingScale(selectedBuilding.id, newScale);
                          setSelectedBuilding({
                            ...selectedBuilding,
                            scale: newScale,
                          });
                        }}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "#9CA3AF",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Width/Length Presets
                    </label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50,
                      ].map((w) => (
                        <button
                          key={w}
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            const newScale = [
                              w,
                              buildingForm.scale?.[1] || 1,
                              buildingForm.scale?.[2] || 1,
                            ];
                            setBuildingForm({
                              ...buildingForm,
                              scale: newScale,
                            });
                            updateBuildingScale(selectedBuilding.id, newScale);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              scale: newScale,
                            });
                          }}
                        >
                          {w}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "#9CA3AF",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Height Presets
                    </label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20,
                      ].map((h) => (
                        <button
                          key={h}
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            const newScale = [
                              buildingForm.scale?.[0] || 1,
                              h,
                              buildingForm.scale?.[2] || 1,
                            ];
                            setBuildingForm({
                              ...buildingForm,
                              scale: newScale,
                            });
                            updateBuildingScale(selectedBuilding.id, newScale);
                            setSelectedBuilding({
                              ...selectedBuilding,
                              scale: newScale,
                            });
                          }}
                        >
                          {h}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleDuplicateBuilding}
                >
                  <Copy size={18} />
                  Duplicate
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleDeleteBuilding}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </>
          )}

          {selectedPath && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2>Path Editor</h2>
                <button
                  onClick={() => {
                    setSelectedPath(null);
                    setSelectedPointIndex(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#10b981",
                    fontWeight: 600,
                  }}
                >
                  Distance: {calculatePathDistance(selectedPath?.points)} meters
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {selectedPath?.points?.length || 0} points
                </div>
              </div>

              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                {creativeMode
                  ? "Drag the green circles to move path points freely"
                  : "Drag the green circles to move path points"}
              </p>

              <div className="form-group">
                <label>Path Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={pathForm.name}
                  onChange={(e) =>
                    setPathForm({ ...pathForm, name: e.target.value })
                  }
                  onBlur={handleUpdatePath}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-select"
                  value={pathForm.type}
                  onChange={(e) =>
                    setPathForm({ ...pathForm, type: e.target.value })
                  }
                  onBlur={handleUpdatePath}
                >
                  <option value="path">Walking Path</option>
                  <option value="road">Road</option>
                  <option value="highway">Highway</option>
                  <option value="railway">Railway</option>
                </select>
              </div>

              <div className="form-group">
                <label>Width</label>
                <input
                  type="number"
                  className="form-input"
                  value={pathForm.width || 4}
                  onChange={(e) =>
                    setPathForm({ ...pathForm, width: Number(e.target.value) })
                  }
                  onBlur={handleUpdatePath}
                />
              </div>

              <div className="form-group">
                <label>Points ({pathForm.points?.length || 0})</label>
                <div style={{ maxHeight: 150, overflow: "auto" }}>
                  {(pathForm.points || []).map((point, index) => {
                    let segmentDistance = 0;
                    if (index < (pathForm.points?.length || 0) - 1) {
                      const dx = pathForm.points[index + 1][0] - point[0];
                      const dz = pathForm.points[index + 1][2] - point[2];
                      segmentDistance = Math.sqrt(dx * dx + dz * dz).toFixed(1);
                    }
                    return (
                      <div
                        key={index}
                        className={`building-list-item ${selectedPointIndex === index ? "active" : ""}`}
                        onClick={() => setSelectedPointIndex(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <Circle
                          size={12}
                          fill={
                            selectedPointIndex === index ? "#10b981" : "#64748b"
                          }
                        />
                        <span>
                          {index + 1}: ({Math.round(point?.[0] || 0)},{" "}
                          {Math.round(point?.[2] || 0)})
                          {index < (pathForm.points?.length || 0) - 1 && (
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "0.7rem",
                              }}
                            >
                              {" "}
                              +{segmentDistance}m
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleAddPathPoint}
                >
                  <Plus size={14} /> Add Point
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleRemovePathPoint}
                  disabled={!selectedPointIndex || pathForm.points.length <= 2}
                >
                  <Trash2 size={14} /> Remove Point
                </button>
              </div>

              <button
                className="btn btn-danger"
                style={{ width: "100%" }}
                onClick={handleDeletePath}
              >
                <Trash2 size={18} />
                Delete Path
              </button>
            </>
          )}
        </div>
      )}

      <div
        className="glass"
        style={{
          position: "fixed",
          left: 344,
          bottom: 24,
          padding: 16,
          maxWidth: 300,
        }}
      >
        <h4
          style={{
            fontSize: "0.85rem",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Info size={16} />
          Buildings ({markers.length}) & Paths ({paths.length})
        </h4>
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          <div>
            Arrow Keys: Move | R: Rotate | Del: Delete | Ctrl+D: Duplicate
          </div>
        </div>
        <div className="building-list" style={{ maxHeight: 200 }}>
          {markers.map((building) => (
            <div
              key={building.id}
              className={`building-list-item ${selectedBuilding?.id === building.id ? "active" : ""}`}
              onClick={() => handleBuildingSelect(building)}
            >
              <div
                className="building-color"
                style={{ background: building.color || "#6366f1" }}
              ></div>
              <div>
                <div style={{ fontWeight: 500 }}>{building.name}</div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {building.type} | {building.floors?.length || 0} floors
                </div>
              </div>
            </div>
          ))}
          {paths.map((path) => (
            <div
              key={path.id}
              className={`building-list-item ${selectedPath?.id === path.id ? "active" : ""}`}
              onClick={() => handlePathSelect(path)}
            >
              <Circle
                size={12}
                fill={path.type === "railway" ? "#dc2626" : "#64748b"}
              />
              <div>
                <div style={{ fontWeight: 500 }}>{path.name}</div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {path.type} | {path.points?.length || 0} points
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>Save Map</h2>
            <div
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#3B82F6",
                  fontWeight: 600,
                }}
              >
                What will be saved:
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: 8,
                }}
              >
                <div>
                  <strong>{markers.length} Buildings:</strong>{" "}
                  {markers
                    .slice(0, 5)
                    .map((m) => m.name)
                    .join(", ")}
                  {markers.length > 5 ? "..." : ""}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>{paths.length} Paths:</strong>{" "}
                  {paths
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(", ")}
                  {paths.length > 3 ? "..." : ""}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Map Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter map name (e.g., Main Campus, Building A Layout)"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                autoFocus
              />
            </div>
            {savedMaps.find((m) => m.name === mapName) && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#F59E0B",
                  marginBottom: 8,
                }}
              >
                Warning: A map with this name already exists. Saving will
                overwrite it.
              </p>
            )}
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              This map will be saved and will persist after page refresh.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSaveModal(false);
                  setMapName("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!mapName.trim()}
              >
                <Save size={18} />
                Save Map
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div
            className="glass modal"
            style={{ maxWidth: 550 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Load Saved Map</h2>
            <div
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#10b981",
                  fontWeight: 600,
                }}
              >
                Current Map: {currentMapName}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {markers.length} buildings | {paths.length} paths
              </div>
            </div>
            {savedMaps && savedMaps.length > 0 ? (
              <>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginBottom: 12,
                  }}
                >
                  Showing {savedMaps.length} saved map(s). Click to load.
                </p>
                <div
                  className="building-list"
                  style={{ maxHeight: 350, marginBottom: 16 }}
                >
                  {savedMaps.map((map, index) => {
                    const buildingNames = (map.buildings || [])
                      .slice(0, 3)
                      .map((b) => b.name)
                      .join(", ");
                    const hasMoreBuildings = (map.buildings || []).length > 3;
                    const hasContent =
                      (map.buildings?.length || 0) > 0 ||
                      (map.paths?.length || 0) > 0;
                    return (
                      <div
                        key={index}
                        className={`building-list-item ${currentMapName === map.name ? "active" : ""}`}
                        onClick={() => handleLoad(map)}
                        style={
                          currentMapName === map.name
                            ? {
                                background: "rgba(16,185,129,0.15)",
                                borderColor: "#10b981",
                              }
                            : {}
                        }
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {map.name}
                            {currentMapName === map.name && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  background: "#10b981",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                Active
                              </span>
                            )}
                          </div>
                          {hasContent ? (
                            <>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#10b981",
                                  marginTop: 2,
                                }}
                              >
                                {map.buildings?.length || 0} buildings |{" "}
                                {map.paths?.length || 0} paths
                              </div>
                              {buildingNames && (
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#9CA3AF",
                                    marginTop: 2,
                                  }}
                                >
                                  Buildings: {buildingNames}
                                  {hasMoreBuildings ? "..." : ""}
                                </div>
                              )}
                            </>
                          ) : (
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#F59E0B",
                                marginTop: 2,
                              }}
                            >
                              Empty map
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "#6B7280",
                              marginTop: 2,
                            }}
                          >
                            Saved: {new Date(map.savedAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedMap(index);
                          }}
                          title="Delete this saved map"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p
                style={{
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No saved maps yet. Use the "Save" button to save your current
                map!
              </p>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  clearMap();
                  setShowLoadModal(false);
                }}
              >
                <Plus size={16} /> New Empty Map
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowLoadModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showResourcesModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowResourcesModal(false)}
        >
          <div
            className="glass modal"
            style={{ maxWidth: 600, maxHeight: "80vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add Resources</h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              Click an item then click on the map to place it. {markers.length}{" "}
              building(s) currently on map.
            </p>
            {resources.map((category, catIndex) => (
              <div key={catIndex} style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, color: "var(--text-muted)" }}>
                  {category.category}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                  }}
                >
                  {category.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      className="btn btn-secondary"
                      style={{ justifyContent: "flex-start", padding: "12px" }}
                      onClick={() => {
                        if (
                          item.type === "path" ||
                          item.type === "road" ||
                          item.type === "railway" ||
                          item.type === "highway"
                        ) {
                          handleAddPath(item.type);
                        } else {
                          setDraggedResource(item);
                          setShowResourcesModal(false);
                        }
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: item.color || "#64748b",
                          marginRight: 8,
                        }}
                      ></div>
                      {item.name}
                      {item.floors && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.75rem",
                            color: "#9CA3AF",
                          }}
                        >
                          {item.floors.length}f
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResourcesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {draggedResource && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(16, 185, 129, 0.95)",
            padding: "12px 24px",
            borderRadius: 8,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 200,
          }}
        >
          <span>
            Placing: <strong>{draggedResource.name}</strong>
          </span>
          <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Click on map to place
          </span>
          <button
            onClick={() => setDraggedResource(null)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "4px 8px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
