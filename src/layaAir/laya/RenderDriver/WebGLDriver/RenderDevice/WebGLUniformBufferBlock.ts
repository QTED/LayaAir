import { BufferTargetType, BufferUsage } from "../../../RenderEngine/RenderEnum/BufferTargetType";
import { ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";
import { WebGLEngine } from "./WebGLEngine";
import { GLBuffer } from "./WebGLEngine/GLBuffer";
import { WebGLSubUniformBuffer } from "./WebGLSubUniformBuffer";
import { WebGLUniformBufferDescriptor } from "./WebGLUniformBufferDescriptor";

class FieldInfo {

    offset: number;
    size: number;

    constructor(offset: number, size: number) {
        this.offset = offset;
        this.size = size;
    }
}

export class WebGLUniformBufferBlock {

    name: string;

    _buffer: GLBuffer;

    _data: ArrayBuffer;

    fields: FieldInfo[];

    bufferOffsetAlignment: number;

    constructor(name: string, engine: WebGLEngine) {
        this.name = name;

        this._data = new Uint8Array(1024 * 256).buffer;

        this._buffer = engine.createBuffer(BufferTargetType.UNIFORM_BUFFER, BufferUsage.Dynamic);
        this._buffer.bindBuffer();
        this._buffer.setDataLength(this._data.byteLength);

        this.fields = [new FieldInfo(0, this._data.byteLength)];
    }

    /**
     * todo 分配空间
     * @param size 
     * @returns 
     */
    getEmptyField(size: number): FieldInfo {
        let fieldIndex = this.fields.findIndex(field => field.size > size);
        if (fieldIndex > -1) {
            let origin = this.fields[fieldIndex];
            // this.fields.splice(fieldIndex, 1);

            let field = new FieldInfo(origin.offset, size);

            origin.offset += size;
            origin.size -= size;

            // this.fields.push(field);

            return field;
        }
        else {
            console.error("not enough space");
        }
        return null;
    }

    createBuffer(name: string, uniformMap: Map<number | string, { id: number, propertyName: string, uniformtype: ShaderDataType, arrayLength: number }>) {

        let descriptor = new WebGLUniformBufferDescriptor(name);

        uniformMap.forEach(uniform => {
            descriptor.addUniform(uniform.id, uniform.uniformtype, uniform.arrayLength);
        });

        descriptor.finish(256 / 4);

        let bufferSize = descriptor.byteLength;

        let field = this.getEmptyField(bufferSize);
        let offset = field.offset;

        descriptor.uniforms.forEach(uniform => {
            uniform.view = new uniform.dataView(this._data, uniform.offset + offset, uniform.viewByteLength / uniform.dataView.BYTES_PER_ELEMENT);
        });

        let subBuffer = new WebGLSubUniformBuffer(this._buffer, field.offset, field.size, this._data, descriptor);
        return subBuffer;
    }

    destroy(): void {
        this._buffer.destroy();
        this._data = null;
    }

}