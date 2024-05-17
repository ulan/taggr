import * as React from "react";
import { UserId, UserData, User } from "./types";
import { Loading, commaSeparated } from "./common";

export const USER_CACHE: UserData = {};

export const populateUserNameCacheSpeculatively = async () =>
    await populateUserNameCache([], undefined, true);

export const populateUserNameCache = async (
    ids: UserId[],
    loadingCallback = (_arg: boolean) => {},
    speculative?: boolean,
) => {
    const misses = ids.filter(
        (id) => id < Number.MAX_SAFE_INTEGER && !(id in USER_CACHE),
    );
    if (!speculative && misses.length == 0) return;
    loadingCallback(true);
    const data = (await window.api.query<UserData>("users_data", misses)) || {};
    loadingCallback(false);
    Object.entries(data).forEach(
        ([id, name]: [string, string]) => (USER_CACHE[Number(id)] = name),
    );
};

export const userNameToIds = async (names: string[]) => {
    if (names.length == 0) return [];
    names = names.map((name) => name.trim().replace("@", ""));
    const cachedNames = Object.entries(USER_CACHE).reduce(
        (acc, [id, name]) => {
            acc[name] = Number(id);
            return acc;
        },
        {} as { [name: string]: UserId },
    );
    return (
        await Promise.all(
            names.map((name) =>
                name in cachedNames
                    ? { id: cachedNames[name] }
                    : window.api.query<User>("user", [name]),
            ),
        )
    )
        .map((user) => user?.id)
        .filter((user) => user != undefined);
};

export const UserLink = ({
    id,
    name,
    classNameArg,
    profile,
}: {
    id: UserId;
    name?: string;
    classNameArg?: string;
    profile?: boolean;
}) => {
    const [loading, setLoading] = React.useState(false);
    const [userName, setUserName] = React.useState<string | null>(null);

    const loadUserName = async () => {
        if (name) USER_CACHE[id] = name;
        await populateUserNameCache([id], setLoading);
        setUserName(USER_CACHE[id]);
    };

    React.useEffect(() => {
        if (id != undefined) loadUserName();
    }, []);

    React.useEffect(() => {
        setUserName(USER_CACHE[id]);
    }, [id]);

    if (loading) return <Loading spaced={false} />;

    return userName ? (
        <a
            className={`${classNameArg} user_link`}
            href={`#/${profile ? "user" : "journal"}/${id}`}
        >
            {userName}
        </a>
    ) : (
        <span>N/A</span>
    );
};

export const UserList = ({
    ids = [],
    profile,
}: {
    ids: UserId[];
    profile?: boolean;
}) => {
    const [loaded, setLoaded] = React.useState(false);

    const loadNames = async () => {
        await populateUserNameCache(ids);
        setLoaded(true);
    };

    React.useEffect(() => {
        loadNames();
    }, []);

    return !loaded ? (
        <Loading spaced={false} />
    ) : (
        commaSeparated(
            ids.map((id) => <UserLink key={id} id={id} profile={profile} />),
        )
    );
};
