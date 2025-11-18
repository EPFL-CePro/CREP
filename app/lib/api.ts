'use server';
import { SelectOption } from "../components/forms/ReactSelect";

export async function fetchPersons(query: string): Promise<SelectOption[]> {
    const url = `https://api.epfl.ch/v1/persons?query=${encodeURIComponent(query)}`;
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Authorization', 'Basic ' + Buffer.from(process.env.EPFL_API_USERNAME + ":" + process.env.EPFL_API_PASSWORD).toString('base64'));
    const res = await fetch(url, {method: 'GET', headers});
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.persons) return [];
    return data.persons.map((p: { id: string, firstname: string, lastname: string, email: string }) => ({
        value: Number(p.id),
        label: `${p.firstname} ${p.lastname}`.trim() || (p.email),
        person: {
            id: Number(p.id),
            firstname: p.firstname,
            lastname: p.lastname,
            email: p.email,
            sciper: p.id,
        }
    })).filter((o: SelectOption) => !!o.value);
}

export async function fetchPersonBySciper(sciper: string): Promise<{id: string, firstname: string, lastname: string, email: string}> {
    const url = `https://api.epfl.ch/v1/persons/${sciper}`;
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Authorization', 'Basic ' + Buffer.from(process.env.EPFL_API_USERNAME + ":" + process.env.EPFL_API_PASSWORD).toString('base64'));
    const res = await fetch(url, {method: 'GET', headers});
    const data = await res.json();
    return data;
}

export async function fetchMultiplePersonsBySciper(scipersWithCommas: string): Promise<{id: string, firstname: string, lastname: string, email: string}[]> {
    const url = `https://api.epfl.ch/v1/persons?ids=${encodeURIComponent(scipersWithCommas)}`;
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Authorization', 'Basic ' + Buffer.from(process.env.EPFL_API_USERNAME + ":" + process.env.EPFL_API_PASSWORD).toString('base64'));
    const res = await fetch(url, {method: 'GET', headers});
    if (!res.ok) return [];
    const data = await res.json();
    return data.persons;
}