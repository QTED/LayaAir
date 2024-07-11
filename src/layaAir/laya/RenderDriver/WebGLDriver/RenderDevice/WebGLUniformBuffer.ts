import { LayaGL } from "../../../layagl/LayaGL";
import { Matrix3x3 } from "../../../maths/Matrix3x3";
import { Matrix4x4 } from "../../../maths/Matrix4x4";
import { Vector2 } from "../../../maths/Vector2";
import { Vector3 } from "../../../maths/Vector3";
import { Vector4 } from "../../../maths/Vector4";
import { BufferTargetType, BufferUsage } from "../../../RenderEngine/RenderEnum/BufferTargetType";
import { ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";
import { GLBuffer } from "./WebGLEngine/GLBuffer";

type DataViewType = Float32ArrayConstructor | Int32ArrayConstructor;

type Uniform = {
    index: number,
    size: number,
    offset: number,
    // todo 
    // other typed array
    view: Float32Array | Int32Array,
    dataView: DataViewType
}

/**
 * 
 */
export class WebGLUniformBuffer {

    _byteLength: number = 0;

    // 
    _currentLength: number = 0;

    /**
     * 属性中最大对齐值
     */
    _maxAlignment: number = 0;

    _data: Float32Array;

    _buffer: GLBuffer;

    name: string;

    uniforms: Map<number, Uniform>;

    needUnload: boolean = false;

    constructor(name: string) {
        this.name = name;
        this.uniforms = new Map();
    }

    /**
     * std140字节对齐
     * @param byte 
     */
    private alignmentPadding(size: number) {

        let alignment = size <= 2 ? size : 4;

        let pointer = this._currentLength;
        let endPadding = pointer % alignment;
        if (endPadding != 0) {
            endPadding = alignment - endPadding;
            this._currentLength += endPadding;
            this._byteLength += endPadding * 4;
        }

        this._maxAlignment = Math.max(this._maxAlignment, alignment);
    }

    /**
     * 
     * @param uniformIndex 
     * @param size 
     * @param arraySize 
     */
    protected addUniformData(uniformIndex: number, size: number, arraySize: number, baseAlignment: number, tsc: DataViewType) {
        if (arraySize > 0) {
            // uniform 数组
            // todo
            this.alignmentPadding(size);

            size = size * arraySize;

            let view: Float32Array;
            let uniform = {
                index: uniformIndex,
                view: view,
                size: size,
                offset: this._currentLength * 4,
                dataView: tsc
            }
            this.uniforms.set(uniformIndex, uniform);

            this._currentLength += size;
            this._byteLength += size * 4;

        }
        else {
            this.alignmentPadding(size);

            let view: Float32Array;
            let uniform = {
                index: uniformIndex,
                view: view,
                size: size,
                offset: this._currentLength * 4,
                dataView: tsc
            }
            this.uniforms.set(uniformIndex, uniform);

            this._currentLength += size;
            this._byteLength += size * 4;
        }
    }

    /**
     * 创建 uniform buffer
     */
    create() {

        this.alignmentPadding(this._maxAlignment);

        const buffer = new Uint8Array(this._byteLength).buffer;
        this._data = new Float32Array(buffer);

        this.uniforms.forEach((uniform) => {
            // todo
            // other typed array
            uniform.view = new uniform.dataView(buffer, uniform.offset, uniform.size);
        });

        this._buffer = LayaGL.renderEngine.createBuffer(BufferTargetType.UNIFORM_BUFFER, BufferUsage.Dynamic);
        this._buffer.bindBuffer();
        this._buffer.setDataLength(this._byteLength);

        this.needUnload = true;
    }

    upload() {
        this._buffer.setData(this._data, 0);
        this.needUnload = false;
    }

    /**
     * 添加 uniform
     * @param index 
     * @param type 
     * @param arraySize 
     */
    addUniform(index: number, type: ShaderDataType, arraySize: number = 0) {
        switch (type) {
            case ShaderDataType.Int:
            case ShaderDataType.Bool:
                this.addUniformData(index, 1, arraySize, 4, Int32Array);
                break;
            case ShaderDataType.Float:
                this.addUniformData(index, 1, arraySize, 4, Float32Array);
                break;
            case ShaderDataType.Vector2:
                this.addUniformData(index, 2, arraySize, 8, Float32Array);
                break;
            case ShaderDataType.Vector3:
                this.addUniformData(index, 3, arraySize, 16, Float32Array);
                break;
            case ShaderDataType.Vector4:
            case ShaderDataType.Color:
                this.addUniformData(index, 4, arraySize, 16, Float32Array);
                break;
            case ShaderDataType.Matrix3x3:
                // mat3 => 3 * vec4
                this.addUniformData(index, 12, arraySize, 16, Float32Array);
                break;
            case ShaderDataType.Matrix4x4:
                this.addUniformData(index, 16, arraySize, 16, Float32Array);
                break;
            case ShaderDataType.Buffer:
                console.log("ShaderDataType.Buffer not support");
                break;
            case ShaderDataType.Texture2D:
            case ShaderDataType.Texture3D:
            case ShaderDataType.TextureCube:
            case ShaderDataType.Texture2DArray:
            case ShaderDataType.None:
            default:
                break;
        }
    }

    setInt(index: number, value: number) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view[0] = value;

            this.needUnload = true;
        }
    }

    setFloat(index: number, value: number) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view[0] = value;

            this.needUnload = true;
        }
    }

    setVector2(index: number, value: Vector2) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view[0] = value.x;
            uniform.view[1] = value.y;

            this.needUnload = true;
        }
    }

    setVector3(index: number, value: Vector3) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view[0] = value.x;
            uniform.view[1] = value.y;
            uniform.view[2] = value.z;

            this.needUnload = true;
        }
    }

    setVector4(index: number, value: Vector4) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view[0] = value.x;
            uniform.view[1] = value.y;
            uniform.view[2] = value.z;
            uniform.view[3] = value.w;

            this.needUnload = true;
        }
    }

    setMatrix3x3(index: number, value: Matrix3x3) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    uniform.view[i * 4 + j] = value.elements[i * 3 + j];
                }
            }

            this.needUnload = true;
        }
    }

    setMatrix4x4(index: number, value: Matrix4x4) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view.set(value.elements);

            this.needUnload = true;
        }
    }

    // todo
    setBuffer(index: number, value: Float32Array) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            uniform.view.set(value);

            this.needUnload = true;
        }
    }

    setUniformData(index: number, type: ShaderDataType, data: any) {
        let uniform = this.uniforms.get(index);
        if (uniform) {
            switch (type) {
                case ShaderDataType.Bool:
                    // todo
                    console.warn("ShaderDataType.Bool not support");
                    break;
                case ShaderDataType.Int:
                    this.setInt(index, data as number);
                    break;
                case ShaderDataType.Float:
                    this.setFloat(index, data as number);
                    break;
                case ShaderDataType.Vector2:
                    this.setVector2(index, data as Vector2);
                    break;
                case ShaderDataType.Vector3:
                    this.setVector3(index, data as Vector3);
                    break;
                case ShaderDataType.Vector4:
                case ShaderDataType.Color:
                    this.setVector4(index, data as Vector4);
                    break;
                case ShaderDataType.Matrix3x3:
                    this.setMatrix3x3(index, data as Matrix3x3);
                    break;
                case ShaderDataType.Matrix4x4:
                    this.setMatrix4x4(index, data as Matrix4x4);
                    break;
                case ShaderDataType.Buffer:
                    // todo
                    // set array value
                    this.setBuffer(index, data as Float32Array);
                    break;
                case ShaderDataType.None:
                case ShaderDataType.Texture2D:
                case ShaderDataType.Texture3D:
                case ShaderDataType.TextureCube:
                case ShaderDataType.Texture2DArray:
                default:
                    break;
            }
        }
    }


    destroy() {
        this.uniforms.clear();
        this._data = null;

        this._buffer.destroy();
    }
}