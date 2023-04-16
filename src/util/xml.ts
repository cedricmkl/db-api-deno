import { parse } from "https://deno.land/x/xml@2.1.0/mod.ts"
import { node } from "https://deno.land/x/xml@2.1.0/utils/types.ts";

export function xml(xml: string): node {
    return parse(xml) as node
}

export function attr(node: node | null, name: string): string | null {
    if (!node) return null
    return node[`@${name}`] as string | null
}

export function attrBool(node: node | null, name: string): boolean | null {
    if (!node) return null
    return node[`@${name}`] as boolean
}

export function node(node: node | null, name: string): node | null {
    if (!node) return null
    return node[name] as node | null
}

export function children(parent: node, name: string): Array<node> {
    if (!node(parent, name)) return []
    if (!Array.isArray(parent[name])) return [parent[name] as node]
    return Object.values(parent[name]!) as Array<node>
}