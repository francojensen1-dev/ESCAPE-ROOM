# Plan de Implementación: Corrección y Perfeccionamiento del Giroscopio Horizontal (Landscape)

## Diagnóstico del Problema Actual
1. **Confusión de Ejes en Orientación Horizontal**: La implementación previa aplicaba cálculos manuales sobre ángulos Euler asumiendo posición vertical (portrait). Al colocar el teléfono en horizontal (landscape a 90° o -90°), los ejes de inclinación (*pitch*) y alabeo (*roll*) se invierten respecto a la pantalla, haciendo que mirar arriba/abajo rote la cámara de costado y viceversa.
2. **Discontinuidad y Saltos Angulares**: El suavizado con interpolación lineal aritmética directa sobre `alpha` (0°–360°) produce saltos bruscos cuando el valor cruza la frontera de 360°/0°.
3. **Falta de Compensación de Orientación de Pantalla**: No se leía dinámicamente `window.screen.orientation.angle` (o `window.orientation`), por lo que girar el teléfono hacia la izquierda (90°) o hacia la derecha (-90°) descalibraba el control.

---

## Solución Propuesta

### 1. Modelo Matemático Cuaternión Estándar (DeviceOrientationControls)
- Migrar del cálculo manual de Euler a la formulación cinemática estándar basada en cuaterniones:
  - Convertir `alpha`, `beta`, `gamma` (en radianes) con orden `'YXZ'` a un cuaternión de orientación del dispositivo.
  - Aplicar rotación de cámara hacia el frente del teléfono (`q1 = Quaternion(-sqrt(0.5), 0, 0, sqrt(0.5))`).
  - Compensar dinámicamente el ángulo de orientación de la pantalla (`orient = -screenOrientationAngle`).
- **Suavizado con `Quaternion.slerp`**: Reemplazar el Lerp numérico por interpolación esférica de cuaterniones (`slerp`) a 60 FPS, garantizando movimientos suaves, sin tirones y completamente inmunes a bloqueos de cardán (*gimbal lock*).

### 2. Soporte Dinámico para Landscape (90° y -90°)
- Detectar en tiempo real el cambio de orientación del dispositivo (`orientationchange` y `screen.orientation.onchange`).
- Adaptar inmediatamente la matriz de rotación tanto si el usuario sostiene el celular con el botón/cámara a la izquierda o a la derecha.
- **Aviso visual sutil**: Si el usuario entra o gira el dispositivo en vertical (portrait), mostrar un indicador elegante invitándolo a girar a horizontal, el cual desaparece automáticamente al colocarse en horizontal.

### 3. Recentrado y Calibración Rápida
- Guardar un cuaternión de compensación de rumbo (*yaw zero*) para que al presionar el botón "Centrar Cámara" (o al iniciar), la vista del jugador apunte exactamente al frente (hacia la puerta principal o la dirección actual de avance).
- Permitir ajuste fino simultáneo con toque/arrastre si el usuario desea reorientar su ángulo base mientras usa el giroscopio.

---

## Archivos a Modificar
1. `src/sensors/SensorManager.ts`:
   - Detección de `screen.orientation.angle` / `window.orientation`.
   - Manejo de cuaterniones y cálculo matemático corregido para landscape.
   - Función de recentrado por cuaternión delta.
2. `src/three/EscapeRoomScene.ts`:
   - Integración del cuaternión objetivo suavizado mediante `camera.quaternion.slerp(targetQuat, slerpFactor)`.
   - Compatibilidad entre la orientación del giroscopio y el rumbo de desplazamiento del joystick (moverse hacia donde mira la cámara).
3. `src/components/TopStatusBar.tsx` & `src/App.tsx`:
   - Indicador dinámico de estado de pantalla horizontal.
   - Aviso flotante amigable si el dispositivo está en vertical (*"Gira tu celular en horizontal para jugar"*).

---

## Criterios de Aceptación
- Al sostener el móvil en horizontal (en 90° o -90°), subir o bajar el celular inclina la cámara suavemente hacia arriba y abajo.
- Girar el cuerpo a los lados rota la vista en 360° en relación 1 a 1 sin saltos de ángulo ni desvíos diagonales extraños.
- El botón de recentrado alinea la cámara hacia adelante al instante.
- Compilación y linteo 100% limpios sin errores TypeScript.
