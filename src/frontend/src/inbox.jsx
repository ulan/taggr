import * as React from "react";
import { HeadBar } from "./common";
import { Content } from "./content";
import { Close } from "./icons";
import { PostView } from "./post";

export const Inbox = () => {
    const [inbox, setInbox] = React.useState(window.user.inbox);
    const ids = Object.keys(inbox);
    if (ids.length == 0) {
        location.href = "#/";
    }
    ids.sort((a, b) => {
        if (a.startsWith("condition") && !b.startsWith("condition")) return -1;
        if (!a.startsWith("condition") && b.startsWith("condition")) return 1;
        if (a.startsWith("watched") && !b.startsWith("watched")) return 1;
        if (!a.startsWith("watched") && b.startsWith("watched")) return -1;
        return b.localeCompare(a);
    });
    return (
        <>
            <HeadBar
                title="INBOX"
                content={
                    <button
                        onClick={() => {
                            window.user.inbox = {};
                            api.call("clear_notifications", Object.keys(inbox));
                            location.href = "#/";
                        }}
                    >
                        CLEAR ALL
                    </button>
                }
            />
            <>
                {ids.map((k) => {
                    const message = inbox[k];
                    let msg = message.Generic;
                    let id = null;
                    if ("NewPost" in message) {
                        id = message.NewPost[1];
                        msg = message.NewPost[0];
                    } else if ("Conditional" in message) {
                        const payload = message.Conditional[1];
                        id = payload.ReportOpen
                            ? payload.ReportOpen
                            : payload.Proposal;
                        msg = message.Conditional[0];
                    } else if ("WatchedPostEntries" in message) {
                        id = parseInt(k.split("_")[1]);
                        msg = `\`${
                            message.WatchedPostEntries.length
                        }\` new thread updates ${message.WatchedPostEntries.map(
                            (id) => `[#${id}](#/thread/${id})`,
                        ).join(", ")} on the watched post`;
                    }
                    return (
                        <div
                            key={k}
                            className="stands_out"
                            style={{ padding: 0 }}
                        >
                            <div className="row_container">
                                <Content
                                    value={msg}
                                    classNameArg="medium_text left_spaced right_spaced max_width_col"
                                />
                                <button
                                    className="reaction_button unselected"
                                    onClick={() => {
                                        api.call("clear_notifications", [k]);
                                        delete inbox[k];
                                        delete window.user.inbox[k];
                                        setInbox({ ...inbox });
                                    }}
                                >
                                    <Close classNameArg="action right_half_spaced" />
                                </button>
                            </div>
                            {id && (
                                <PostView
                                    id={id}
                                    classNameArg="top_framed"
                                    isFeedItem={true}
                                    highlighted={message.WatchedPostEntries}
                                />
                            )}
                        </div>
                    );
                })}
            </>
        </>
    );
};
