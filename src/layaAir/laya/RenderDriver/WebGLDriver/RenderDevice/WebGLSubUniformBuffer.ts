import { GLBuffer } from "./WebGLEngine/GLBuffer";
import { WebGLUniformBufferBase } from "./WebGLUniformBufferBase";
import { Uniform, WebGLUniformBufferDescriptor } from "./WebGLUniformBufferDescriptor";

export class WebGLSubUniformBuffer extends WebGLUniformBufferBase {

    _data: Float32Array;

    _buffer: GLBuffer;

    offset: number;

    size: number;

    descriptor: WebGLUniformBufferDescriptor;

    get uniforms(): ReadonlyMap<number, Uniform> {
        return this.descriptor.uniforms;
    }

    constructor(glBuffer: GLBuffer, offset: number, size: number, originData: ArrayBuffer, descriptor: WebGLUniformBufferDescriptor) {
        super();
        this._buffer = glBuffer;
        this.offset = offset;
        this.size = size;
        this._data = new Float32Array(originData, offset, size / 4);

        this.descriptor = descriptor;
    }

    upload() {
        this._buffer.setDataEx(this._data, this.offset, this.size / this._data.BYTES_PER_ELEMENT);
        this.needUpload = false;
    }

    bind(location: number) {
        this._buffer.bindBufferRange(location, this.offset, this.size);
    }

    destroy() {
        this._buffer = null;
        this._data = null;
        this.offset = 0;
        this.size = 0;

        // todo 
        // 释放空间
    }

}