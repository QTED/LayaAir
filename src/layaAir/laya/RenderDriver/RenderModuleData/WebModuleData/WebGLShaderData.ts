import { Config3D } from "../../../../Config3D";
import { LayaGL } from "../../../layagl/LayaGL";
import { Color } from "../../../maths/Color";
import { Matrix3x3 } from "../../../maths/Matrix3x3";
import { Matrix4x4 } from "../../../maths/Matrix4x4";
import { Vector2 } from "../../../maths/Vector2";
import { Vector3 } from "../../../maths/Vector3";
import { Vector4 } from "../../../maths/Vector4";
import { Shader3D } from "../../../RenderEngine/RenderShader/Shader3D";
import { BaseTexture } from "../../../resource/BaseTexture";
import { Resource } from "../../../resource/Resource";
import { InternalTexture } from "../../DriverDesign/RenderDevice/InternalTexture";
import { ShaderData, ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";
import { WebGLCommandUniformMap } from "../../WebGLDriver/RenderDevice/WebGLCommandUniformMap";
import { WebGLEngine } from "../../WebGLDriver/RenderDevice/WebGLEngine";
import { WebGLUniformBuffer } from "../../WebGLDriver/RenderDevice/WebGLUniformBuffer";
import { ShaderDefine } from "../Design/ShaderDefine";
import { WebDefineDatas } from "./WebDefineDatas";

/**
 * 着色器数据类。
 */
export class WebGLShaderData extends ShaderData {
	/**@internal 反向找Material*/
	protected _ownerResource: Resource = null;

	/**@internal */
	protected _gammaColorMap: Map<number, Color>;

	/**@internal */
	_data: any = null;

	/** @internal */
	_defineDatas: WebDefineDatas = new WebDefineDatas();

	/** @internal */
	uniformBuffers: Map<string, WebGLUniformBuffer>;

	/** @internal */
	uniformBuffersPropertyMap: Map<number, WebGLUniformBuffer>;

	/**
	 * @internal	
	 */
	constructor(ownerResource: Resource = null) {
		super(ownerResource);
		this._initData();
	}
	/**
	 * @internal
	 */
	_initData(): void {
		this._data = {};
		this._gammaColorMap = new Map();
		this.uniformBuffers = new Map();
		this.uniformBuffersPropertyMap = new Map();
	}

	createUniformBuffer(name: string, uniformMap: Map<number | string, { id: number, propertyName: string, uniformtype: ShaderDataType, arrayLength: number }>): void {
		if (!Config3D._uniformBlock || this.uniformBuffers.has(name)) {
			return;
		}

		let buffer = new WebGLUniformBuffer(name);
		this.uniformBuffers.set(name, buffer);

		uniformMap.forEach((uniform, key) => {
			let uniformId = uniform.id;
			buffer.addUniform(uniformId, uniform.uniformtype, uniform.arrayLength);
			this.uniformBuffersPropertyMap.set(uniformId, buffer);
		});

		buffer.create();

		// update shader data to uniform buffer
		uniformMap.forEach((uniform, key) => {
			let uniformId = uniform.id;
			let data = this._data[uniformId];
			if (data) {
				buffer.setUniformData(uniformId, uniform.uniformtype, data);
			}
		});

		let id = Shader3D.propertyNameToID(name);
		this._data[id] = buffer;

		return;
	}

	/**
	 * 注意!!!!!! 不要获得data之后直接设置值，设置值请使用set函数
	 * @internal
	 */
	getData(): any {
		return this._data;
	}

	/**
	 * 增加Shader宏定义。
	 * @param value 宏定义。
	 */
	addDefine(define: ShaderDefine): void {
		this._defineDatas.add(define);
	}

	addDefines(define: WebDefineDatas): void {
		this._defineDatas.addDefineDatas(define);
	}

	/**
	 * 移除Shader宏定义。
	 * @param value 宏定义。
	 */
	removeDefine(define: ShaderDefine): void {
		this._defineDatas.remove(define);
	}

	/**
	 * 是否包含Shader宏定义。
	 * @param value 宏定义。
	 */
	hasDefine(define: ShaderDefine): boolean {
		return this._defineDatas.has(define);
	}

	/**
	 * 清空宏定义。
	 */
	clearDefine(): void {
		this._defineDatas.clear();
	}

	clearData(): void {
		for (const key in this._data) {
			// remove resource reference
			if (this._data[key] instanceof Resource) {
				this._data[key]._removeReference();
			}
		}
		this.uniformBuffersPropertyMap.clear();

		this.uniformBuffers.forEach((buffer) => {
			buffer.destroy();
		});
		this.uniformBuffers.clear();
	}

	/**
	 * 获取布尔。
	 * @param	index shader索引。
	 * @return  布尔。
	 */
	getBool(index: number): boolean {
		return this._data[index];
	}

	/**
	 * 设置布尔。
	 * @param	index shader索引。
	 * @param	value 布尔。
	 */
	setBool(index: number, value: boolean): void {
		this._data[index] = value;

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			// todo
			// ubo.setBool(index, value);
		}
	}

	/**
	 * 获取整形。
	 * @param	index shader索引。
	 * @return  整形。
	 */
	getInt(index: number): number {
		return this._data[index];
	}

	/**
	 * 设置整型。
	 * @param	index shader索引。
	 * @param	value 整形。
	 */
	setInt(index: number, value: number): void {
		this._data[index] = value;

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setInt(index, value);
		}
	}

	/**
	 * 获取浮点。
	 * @param	index shader索引。
	 * @return	浮点。
	 */
	getNumber(index: number): number {
		return this._data[index];
	}

	/**
	 * 设置浮点。
	 * @param	index shader索引。
	 * @param	value 浮点。
	 */
	setNumber(index: number, value: number): void {
		this._data[index] = value;

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setFloat(index, value);
		}
	}

	/**
	 * 获取Vector2向量。
	 * @param	index shader索引。
	 * @return Vector2向量。
	 */
	getVector2(index: number): Vector2 {
		return this._data[index];
	}

	/**
	 * 设置Vector2向量。
	 * @param	index shader索引。
	 * @param	value Vector2向量。
	 */
	setVector2(index: number, value: Vector2): void {
		if (this._data[index]) {
			value.cloneTo(this._data[index]);
		} else
			this._data[index] = value.clone();

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setVector2(index, value);
		}
	}

	/**
	 * 获取Vector3向量。
	 * @param	index shader索引。
	 * @return Vector3向量。
	 */
	getVector3(index: number): Vector3 {
		return this._data[index];
	}

	/**
	 * 设置Vector3向量。
	 * @param	index shader索引。
	 * @param	value Vector3向量。
	 */
	setVector3(index: number, value: Vector3): void {
		if (this._data[index]) {
			value.cloneTo(this._data[index]);
		} else
			this._data[index] = value.clone();

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setVector3(index, value);
		}
	}

	/**
	 * 获取颜色。
	 * @param 	index shader索引。
	 * @return  向量。
	 */
	getVector(index: number): Vector4 {
		return this._data[index];
	}

	/**
	 * 设置向量。
	 * @param	index shader索引。
	 * @param	value 向量。
	 */
	setVector(index: number, value: Vector4): void {
		if (this._data[index]) {
			value.cloneTo(this._data[index]);
		} else
			this._data[index] = value.clone();

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setVector4(index, value);
		}
	}

	/**
	 * 获取颜色
	 * @param index 索引
	 * @returns 颜色
	 */
	getColor(index: number): Color {
		return this._gammaColorMap.get(index);
	}

	/**
	 * 设置颜色
	 * @param index 索引
	 * @param value 颜色值
	 */
	setColor(index: number, value: Color): void {
		if (!value)
			return;
		if (this._data[index]) {
			let gammaColor = this._gammaColorMap.get(index);
			value.cloneTo(gammaColor);
			let linearColor = this._data[index];
			linearColor.x = Color.gammaToLinearSpace(value.r);
			linearColor.y = Color.gammaToLinearSpace(value.g);
			linearColor.z = Color.gammaToLinearSpace(value.b);
			linearColor.w = value.a;
		}
		else {
			let linearColor = new Vector4();
			linearColor.x = Color.gammaToLinearSpace(value.r);
			linearColor.y = Color.gammaToLinearSpace(value.g);
			linearColor.z = Color.gammaToLinearSpace(value.b);
			linearColor.w = value.a;
			this._data[index] = linearColor;
			this._gammaColorMap.set(index, value.clone());
		}

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setVector4(index, this._data[index]);
		}
	}

	/**
	 * @internal
	 * @param index 
	 */
	getLinearColor(index: number): Vector4 {
		return this._data[index];
	}

	/**
	 * 获取矩阵。
	 * @param	index shader索引。
	 * @return  矩阵。
	 */
	getMatrix4x4(index: number): Matrix4x4 {
		return this._data[index];
	}

	/**
	 * 设置矩阵。
	 * @param	index shader索引。
	 * @param	value  矩阵。
	 */
	setMatrix4x4(index: number, value: Matrix4x4): void {
		if (this._data[index]) {
			value.cloneTo(this._data[index]);
		} else {
			this._data[index] = value.clone();
		}

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setMatrix4x4(index, value);
		}
	}

	/**
	 * 获取矩阵
	 * @param index 
	 * @returns 
	 */
	getMatrix3x3(index: number): Matrix3x3 {
		return this._data[index];
	}

	/**
	 * 设置矩阵。
	 * @param index 
	 * @param value 
	 */
	setMatrix3x3(index: number, value: Matrix3x3): void {
		if (this._data[index]) {
			value.cloneTo(this._data[index]);
		}
		else {
			this._data[index] = value.clone();
		}

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setMatrix3x3(index, value);
		}
	}

	/**
	 * 获取Buffer。
	 * @param	index shader索引。
	 * @return
	 */
	getBuffer(index: number): Float32Array {
		return this._data[index];
	}

	/**
	 * 设置Buffer。
	 * @param	index shader索引。
	 * @param	value  buffer数据。
	 */
	setBuffer(index: number, value: Float32Array): void {
		this._data[index] = value;

		let ubo = this.uniformBuffersPropertyMap.get(index);
		if (ubo) {
			ubo.setBuffer(index, value);
		}
	}

	/**
	 * 设置纹理。
	 * @param	index shader索引。
	 * @param	value 纹理。
	 */
	setTexture(index: number, value: BaseTexture): void {
		var lastValue: BaseTexture = this._data[index];
		if (value) {
			let shaderDefine = WebGLEngine._texGammaDefine[index];
			if (shaderDefine && value && value.gammaCorrection > 1) {
				this.addDefine(shaderDefine);
			}
			else {
				// todo 自动的
				shaderDefine && this.removeDefine(shaderDefine);
			}
		}
		//维护Reference
		this._data[index] = value;
		lastValue && lastValue._removeReference();
		value && value._addReference();
	}

	_setInternalTexture(index: number, value: InternalTexture) {
		var lastValue: InternalTexture = this._data[index];
		if (value) {
			let shaderDefine = WebGLEngine._texGammaDefine[index];
			if (shaderDefine && value && value.gammaCorrection > 1) {
				this.addDefine(shaderDefine);
			}
			else {
				// todo 自动的
				shaderDefine && this.removeDefine(shaderDefine);
			}
		}
		//维护Reference
		this._data[index] = value;
		// lastValue && lastValue._removeReference();
		// value && value._addReference();
	}

	/**
	 * 获取纹理。
	 * @param	index shader索引。
	 * @return  纹理。
	 */
	getTexture(index: number): BaseTexture {
		return this._data[index];
	}

	getSourceIndex(value: any) {
		for (var i in this._data) {
			if (this._data[i] == value)
				return Number(i);
		}
		return -1;
	}

	/**
	 * 克隆。
	 * @param	destObject 克隆源。
	 */
	cloneTo(destObject: WebGLShaderData): void {
		var dest: WebGLShaderData = <WebGLShaderData>destObject;
		var destData: { [key: string]: number | boolean | Vector2 | Vector3 | Vector4 | Matrix3x3 | Matrix4x4 | BaseTexture | WebGLUniformBuffer } = dest._data;

		destObject.clearData();
		for (var k in this._data) {//TODO:需要优化,杜绝is判断，慢
			var value: any = this._data[k];
			if (value != null) {
				if (typeof value == "number") {
					destData[k] = value;
				}
				else if (typeof value == "boolean") {
					destData[k] = value;
				}
				else if (value instanceof Vector2) {
					var v2 = destData[k] || (destData[k] = new Vector2());
					(<Vector2>value).cloneTo(v2);
					destData[k] = v2;
				}
				else if (value instanceof Vector3) {
					var v3 = destData[k] || (destData[k] = new Vector3());
					(<Vector3>value).cloneTo(v3);
					destData[k] = v3;
				}
				else if (value instanceof Vector4) {
					let color = this.getColor(parseInt(k));
					if (color) {
						let clonecolor = color.clone();
						destObject.setColor(parseInt(k), clonecolor);
					} else {
						var v4 = destData[k] || (destData[k] = new Vector4());
						(<Vector4>value).cloneTo(v4);
						destData[k] = v4;
					}
				}
				else if (value instanceof Matrix3x3) {
					let mat = destData[k] || (destData[k] = new Matrix3x3());
					value.cloneTo(mat);
					destData[k] = mat;
				}
				else if (value instanceof Matrix4x4) {
					var mat = destData[k] || (destData[k] = new Matrix4x4());
					(<Matrix4x4>value).cloneTo(mat);
					destData[k] = mat;
				}
				else if (value instanceof BaseTexture) {
					destData[k] = value;
					value._addReference();
				}
				else if (value instanceof Resource) {
					destData[k] = value as any;
					value._addReference();
				}
			}
		}
		this._defineDatas.cloneTo(dest._defineDatas);
		this._gammaColorMap.forEach((color, index) => {
			destObject._gammaColorMap.set(index, color.clone());
		});

		this.uniformBuffers.forEach((buffer, key) => {
			let destBuffer = buffer.clone();
			dest.uniformBuffers.set(key, destBuffer);
			destBuffer.uniforms.forEach((uniform, key) => {
				dest.uniformBuffersPropertyMap.set(key, destBuffer);
			});
			let bufferId = Shader3D.propertyNameToID(key);
			destData[bufferId] = destBuffer;
		});

	}

	getDefineData(): WebDefineDatas {
		return this._defineDatas;
	}

	/**
	 * 克隆。
	 * @return	 克隆副本。
	 */
	clone(): any {
		var dest: WebGLShaderData = new WebGLShaderData();
		this.cloneTo(dest);
		return dest;
	}

	reset() {
		for (var k in this._data) {
			//维护Refrence
			var value: any = this._data[k];
			if (value instanceof Resource) {
				value._removeReference();
			}
		}
		this._data = {};
		this._gammaColorMap.clear();
		this._defineDatas.clear();

		this.uniformBuffersPropertyMap.clear();

		this.uniformBuffers.forEach((buffer) => {
			buffer.destroy();
		});
		this.uniformBuffers.clear();
	}

	destroy(): void {
		this._defineDatas.destroy();
		this._defineDatas = null;
		for (var k in this._data) {
			//维护Refrence
			var value: any = this._data[k];
			if (value instanceof Resource) {
				value._removeReference();
			}
		}
		this._data = null;
		this._gammaColorMap.clear();
		this._gammaColorMap = null;

		this.uniformBuffersPropertyMap.clear();

		this.uniformBuffers.forEach((buffer) => {
			buffer.destroy();
		});
		this.uniformBuffers.clear();
	}
}

