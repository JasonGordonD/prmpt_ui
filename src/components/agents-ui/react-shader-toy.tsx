'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type Uniform = {
  type: string;
  value: number | number[];
};

type Uniforms = Record<string, Uniform>;

export interface ReactShaderToyProps {
  fs: string;
  uniforms?: Uniforms;
  style?: React.CSSProperties;
  precision?: 'highp' | 'mediump' | 'lowp';
  devicePixelRatio?: number;
  onError?: (error: string) => void;
  onWarning?: (warning: string) => void;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

function setUniform(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation,
  type: string,
  value: number | number[],
) {
  switch (type) {
    case '1f':
      if (typeof value === 'number') gl.uniform1f(location, value);
      break;
    case '2f':
      if (Array.isArray(value) && value.length >= 2) gl.uniform2f(location, value[0]!, value[1]!);
      break;
    case '3f':
      if (Array.isArray(value) && value.length >= 3) gl.uniform3f(location, value[0]!, value[1]!, value[2]!);
      break;
    case '4f':
      if (Array.isArray(value) && value.length >= 4) gl.uniform4f(location, value[0]!, value[1]!, value[2]!, value[3]!);
      break;
    case '1i':
      if (typeof value === 'number') gl.uniform1i(location, value);
      break;
    case '1fv':
      if (Array.isArray(value)) gl.uniform1fv(location, value);
      break;
    case '2fv':
      if (Array.isArray(value)) gl.uniform2fv(location, value);
      break;
    case '3fv':
      if (Array.isArray(value)) gl.uniform3fv(location, value);
      break;
    case '4fv':
      if (Array.isArray(value)) gl.uniform4fv(location, value);
      break;
    case '1iv':
      if (Array.isArray(value)) gl.uniform1iv(location, value);
      break;
    case '2iv':
      if (Array.isArray(value)) gl.uniform2iv(location, value);
      break;
    case '3iv':
      if (Array.isArray(value)) gl.uniform3iv(location, value);
      break;
    case '4iv':
      if (Array.isArray(value)) gl.uniform4iv(location, value);
      break;
    case 'Matrix2fv':
      if (Array.isArray(value)) gl.uniformMatrix2fv(location, false, value);
      break;
    case 'Matrix3fv':
      if (Array.isArray(value)) gl.uniformMatrix3fv(location, false, value);
      break;
    case 'Matrix4fv':
      if (Array.isArray(value)) gl.uniformMatrix4fv(location, false, value);
      break;
    default:
      break;
  }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  onError: (error: string) => void,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    onError(gl.getShaderInfoLog(shader) ?? 'Shader compile failed');
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ReactShaderToy({
  fs,
  uniforms,
  style,
  precision = 'highp',
  devicePixelRatio = 1,
  onError = console.error,
  onWarning = console.warn,
  ...canvasProps
}: ReactShaderToyProps & ComponentPropsWithoutRef<'canvas'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) {
      onError('WebGL not supported');
      return;
    }

    const uniformDecls = Object.entries(uniforms ?? {})
      .map(([name, uniform]) => {
        const glslType =
          uniform.type === '1f'
            ? 'float'
            : uniform.type === '2f' || uniform.type === '2fv'
              ? 'vec2'
              : uniform.type === '3f' || uniform.type === '3fv'
                ? 'vec3'
                : uniform.type === '4f' || uniform.type === '4fv'
                  ? 'vec4'
                  : uniform.type === '1i'
                    ? 'int'
                    : uniform.type.includes('Matrix2')
                      ? 'mat2'
                      : uniform.type.includes('Matrix3')
                        ? 'mat3'
                        : uniform.type.includes('Matrix4')
                          ? 'mat4'
                          : 'float';
        return `uniform ${glslType} ${name};`;
      })
      .join('\n');

    const fragmentSource = `
precision ${precision} float;
uniform vec3 iResolution;
uniform float iTime;
${uniformDecls}
${fs}
void main() {
  vec4 color = vec4(0.0,0.0,0.0,1.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER, onError);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, onError);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) {
      onError('Failed to create shader program');
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      onError(gl.getProgramInfoLog(program) ?? 'Program link failed');
      return;
    }

    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const iTimeLoc = gl.getUniformLocation(program, 'iTime');

    const uniformLocations = new Map<string, WebGLUniformLocation>();
    Object.keys(uniforms ?? {}).forEach((name) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc) uniformLocations.set(name, loc);
      else onWarning(`Uniform not found in shader: ${name}`);
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      const dpr = devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onResize = () => resize();
    resize();
    window.addEventListener('resize', onResize);

    const render = (now: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }

      const elapsed = (now - startTimeRef.current) / 1000;
      gl.uniform3f(iResolutionLoc, canvas.width, canvas.height, 1);
      gl.uniform1f(iTimeLoc, elapsed);

      Object.entries(uniforms ?? {}).forEach(([name, uniform]) => {
        const loc = uniformLocations.get(name);
        if (!loc) return;
        setUniform(gl, loc, uniform.type, uniform.value);
      });

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', onResize);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (buffer) gl.deleteBuffer(buffer);
    };
  }, [fs, uniforms, precision, devicePixelRatio, onError, onWarning]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', ...style }}
      {...canvasProps}
    />
  );
}
