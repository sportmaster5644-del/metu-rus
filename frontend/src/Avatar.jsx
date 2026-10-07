import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const asset = path => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`

function Human({ analyser, emotion, reduced, portrait }) {
  const { scene } = useGLTF(asset('models/tutor.glb'), false)
  const object = useMemo(()=>clone(scene),[scene])
  const group=useRef(),data=useRef(new Uint8Array(256)),blinkTime=useRef(3.7)
  const rig = useMemo(()=>{
    const morphs=[],bones={};object.updateMatrixWorld(true)
    object.traverse(o=>{
      if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;if(o.morphTargetDictionary)morphs.push(o)}
      if(o.isBone){bones[o.name]={bone:o,base:o.quaternion.clone(),inverse:o.getWorldQuaternion(new THREE.Quaternion()).invert()}}
    });
    for(const [name,angle] of [['Bip01_L_UpperArm',-.58],['Bip01_R_UpperArm',.58]]) { const arm=bones[name];if(arm){const axis=new THREE.Vector3(0,0,1).applyQuaternion(arm.inverse);arm.bone.quaternion.copy(arm.base).multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle))} }
    object.updateMatrixWorld(true);return {morphs,bones}
  },[object])
  useEffect(()=>{rig.morphs.forEach(m=>{m.morphTargetInfluences.fill(0)})},[rig])
  const value=(pattern,target,dt)=>{for(const mesh of rig.morphs){const pair=Object.entries(mesh.morphTargetDictionary).find(([name])=>name.endsWith(pattern));if(pair){const i=pair[1];mesh.morphTargetInfluences[i]=THREE.MathUtils.damp(mesh.morphTargetInfluences[i],target,18,dt)}}}
  useFrame(({clock},dt)=>{
    const t=clock.elapsedTime
    let energy=0
    if(analyser?.current){analyser.current.getByteFrequencyData(data.current);for(let i=2;i<45;i++)energy+=data.current[i];energy=THREE.MathUtils.clamp(energy/43/180,0,1)}
    const speaking=emotion==='speaking'
    if(speaking && !analyser?.current) energy=.48+Math.sin(t*9)*.13+Math.sin(t*15)*.07
    const level=speaking?THREE.MathUtils.clamp(energy,0,1):0
    value('AK_25_JawOpen',level*.38,dt)
    value('AA_VI_10_aa',level*.28*(.6+Math.sin(t*11)*.3),dt)
    value('AA_VI_11_E',level*.12*(.5+Math.cos(t*13)*.5),dt)
    value('AA_VI_13_O',level*.12*(.5+Math.sin(t*9)*.5),dt)
    value('AK_32_MouthFunnel',level*.06,dt)
    value('AK_44_MouthSmileLeft',speaking?.14:.1,dt);value('AK_45_MouthSmileRight',speaking?.14:.1,dt)
    value('AK_03_BrowInnerUp',emotion==='listening'?.17:emotion==='thinking'?.09:.025,dt)
    if(!reduced){
      if(t>blinkTime.current+.18)blinkTime.current=t+3.6+Math.random()*2.3
      const blink=t>blinkTime.current?Math.sin(Math.PI*(t-blinkTime.current)/.18):0
      value('AK_09_EyeBlinkLeft',Math.max(0,blink),dt);value('AK_10_EyeBlinkRight',Math.max(0,blink),dt)
      const head=rig.bones.Bip01_Head
      if(head){const yaw=Math.sin(t*.38)*.022+(emotion==='listening'?.025:0),nod=Math.sin(t*.63)*.012
        const axisY=new THREE.Vector3(0,1,0).applyQuaternion(head.inverse),axisX=new THREE.Vector3(1,0,0).applyQuaternion(head.inverse)
        head.bone.quaternion.copy(head.base).multiply(new THREE.Quaternion().setFromAxisAngle(axisY,yaw)).multiply(new THREE.Quaternion().setFromAxisAngle(axisX,nod))
      }
      if(group.current){group.current.position.y=Math.sin(t*1.45)*.003;group.current.rotation.y=Math.sin(t*.25)*.012}
    }
  })
  return <group ref={group}><primitive object={object} scale={.01} dispose={null}/></group>
}
function CameraFit({ portrait }) {
  const {camera,size}=useThree()
  useEffect(()=>{
    const ratio=size.width/Math.max(size.height,1)
    const target=portrait?1.48:.87
    camera.position.set(0,target,portrait?Math.max(1.48,.9/ratio):Math.max(3.7,2.25/ratio))
    camera.lookAt(0,target,-.025);camera.updateProjectionMatrix()
  },[camera,size.width,size.height,portrait])
  return null
}
function Lights({low,portrait}) {
  return <><ambientLight intensity={.75}/><hemisphereLight args={['#e1eaff','#343445',1.2]}/><directionalLight position={[2.4,3.5,3]} intensity={2.25} color="#fff2e4" castShadow={!low} shadow-mapSize={[1024,1024]}/><directionalLight position={[-2,2.6,1.5]} intensity={.9} color="#dce7ff"/><directionalLight position={[0,2.1,-2]} intensity={1.8} color="#aab6eb"/>{!portrait&&!low&&<ContactShadows position={[0,-.01,0]} opacity={.38} scale={4} blur={2.2} far={2} frames={1}/>}</>
}
class Boundary extends React.Component {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<Fallback/>:this.props.children}
}
function Fallback(){return <div className="avatar-fallback"><img src={asset('metu-logo.jpg')} alt="METU"/><strong>AI-преподаватель</strong><small>Текст и голос доступны без 3D</small></div>}
export default function Avatar({analyser,quality='auto',emotion='idle'}) {
  const shell=useRef(),intersecting=useRef(true)
  const [visible,setVisible]=useState(true),[rotate,setRotate]=useState(false),[portrait,setPortrait]=useState(true)
  const [supported]=useState(()=>{try{const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2')||canvas.getContext('webgl');const result=!!context;context?.getExtension('WEBGL_lose_context')?.loseContext();return result}catch{return false}})
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const low=quality==='low'||(navigator.hardwareConcurrency||4)<=4
  useEffect(()=>{
    const observer=new IntersectionObserver(([entry])=>{intersecting.current=entry.isIntersecting;setVisible(entry.isIntersecting&&!document.hidden)})
    observer.observe(shell.current);const visibility=()=>setVisible(intersecting.current&&!document.hidden)
    document.addEventListener('visibilitychange',visibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility)}
  },[])
  return <div ref={shell} className="avatar-shell">
    <Boundary>{supported?<Canvas camera={{position:[0,1.48,1.48],fov:31}} dpr={low?1:[1,1.5]} shadows={!low} gl={{antialias:!low,alpha:true,powerPreference:'low-power'}} frameloop={visible?(reduced&&emotion==='idle'?'demand':'always'):'never'} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.86}}>
      <CameraFit portrait={portrait}/><Lights low={low} portrait={portrait}/><Suspense fallback={null}><Human analyser={analyser} emotion={emotion} reduced={reduced} portrait={portrait}/></Suspense>
      <OrbitControls enabled={rotate} target={[0,portrait?1.48:.87,0]} enablePan={false} enableZoom={false} minAzimuthAngle={-.4} maxAzimuthAngle={.4} minPolarAngle={1.4} maxPolarAngle={1.7}/>
    </Canvas>:<Fallback/>}</Boundary>
    <div className="avatar-controls"><button className="avatar-control" aria-pressed={rotate} onClick={()=>setRotate(v=>!v)} aria-label="Вращение модели">↻</button><button className="avatar-control avatar-view" onClick={()=>setPortrait(v=>!v)} aria-label="Сменить ракурс модели">{portrait?'В полный рост':'Портрет'}</button><span>Живой 3D-аватар</span></div>
  </div>
}
