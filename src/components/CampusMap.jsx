import { Canvas } from '@react-three/fiber'
import { OrbitControls, MapControls } from '@react-three/drei'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'
import CampusScene, { IndoorScene } from './CampusScene'
import { useStore } from '../store/useStore'

export default function CampusMap({ 
  onBuildingSelect, 
  selectedBuilding, 
  viewMode = 'outdoor', 
  navigationPath = [], 
  adminMode = false, 
  onDragEnd, 
  onSelectRoom, 
  selectedPath, 
  onSelectPath,
  onPathPointDrag,
  selectedPointIndex,
  onPointSelect,
  showGrid = false,
  gridSize = 5
}) {
  const controlsRef = useRef()
  const [activeControl, setActiveControl] = useState('orbit')
  
  return (
    <div className="campus-canvas">
      <Canvas 
        camera={{ position: [80, 70, 80], fov: 45 }} 
        gl={{ 
          antialias: true, 
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#87CEEB', 80, 200]} />
          
          <ambientLight intensity={0.5} color="#ffffff" />
          <directionalLight 
            position={[60, 80, 30]} 
            intensity={1.3} 
          />
          <hemisphereLight 
            skyColor="#87ceeb" 
            groundColor="#4a7c3f" 
            intensity={0.45} 
          />
          
          {viewMode === 'indoor' && selectedBuilding ? (
            <IndoorScene 
              building={selectedBuilding} 
              onExit={() => onBuildingSelect(null)}
              adminMode={adminMode}
              onSelectRoom={onSelectRoom}
            />
          ) : (
            <CampusScene 
              onBuildingSelect={onBuildingSelect} 
              selectedBuilding={selectedBuilding}
              adminMode={adminMode}
              onDragEnd={onDragEnd}
              onSelectRoom={onSelectRoom}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onPathPointDrag={onPathPointDrag}
              selectedPointIndex={selectedPointIndex}
              onPointSelect={onPointSelect}
              showGrid={showGrid}
              gridSize={gridSize}
            />
          )}
          
          {activeControl === 'orbit' ? (
            <OrbitControls 
              ref={controlsRef}
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              minDistance={20}
              maxDistance={200}
              maxPolarAngle={Math.PI / 2.05}
              target={viewMode === 'indoor' && selectedBuilding ? selectedBuilding.position : [0, 0, 0]}
              enableDamping
              dampingFactor={0.08}
              rotateSpeed={0.8}
              panSpeed={1.2}
              zoomSpeed={1.2}
            />
          ) : (
            <MapControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={false}
              minDistance={20}
              maxDistance={200}
              target={[0, 0, 0]}
              enableDamping
              dampingFactor={0.08}
              panSpeed={1.2}
              zoomSpeed={1.2}
            />
          )}
        </Suspense>
      </Canvas>
      
      <div className="map-controls" style={{ bottom: 100 }}>
        <button 
          className={`control-btn ${activeControl === 'orbit' ? 'active' : ''}`}
          onClick={() => setActiveControl('orbit')}
          title="Orbit - Rotate around"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </button>
        <button 
          className={`control-btn ${activeControl === 'pan' ? 'active' : ''}`}
          onClick={() => setActiveControl('pan')}
          title="Pan - Move around"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20"/>
          </svg>
        </button>
      </div>

      <div className="zoom-controls">
        <button 
          className="zoom-btn"
          onClick={() => {
            if (controlsRef.current) {
              const currentDistance = controlsRef.current.getDistance()
              controlsRef.current.dolly(currentDistance * 1.2)
            }
          }}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="zoom-btn"
          onClick={() => {
            if (controlsRef.current) {
              const currentDistance = controlsRef.current.getDistance()
              controlsRef.current.dolly(currentDistance / 1.2)
            }
          }}
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  )
}
